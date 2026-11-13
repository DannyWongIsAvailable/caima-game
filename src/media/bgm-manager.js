const PLAYLIST = require('./bgm-playlist');
const BgmCache = require('./bgm-cache');

const STARTUP_PLAY_TIMEOUT_MS = 9000;
const STARTUP_STABLE_MS = 1800;
const STARTUP_MAX_ATTEMPTS = 3; // 首播 + 最多 2 次按用户选择重试
const STARTUP_RETRY_DELAY_MS = 450;
// onCanplay 在个别基础库/本地路径下可能不触发，不能无限等候。
const AUDIO_READY_FALLBACK_MS = 1200;

/**
 * BGM 从持久缓存读取 MP3。每次换曲/重试使用独立的音频上下文，
 * 防止上一个音频上下文的异步 onError/onPlay 影响当前歌曲。
 */
class BgmManager {
  constructor(wxApi, randomFn, cache, onNotice, timers) {
    this.wxApi = wxApi;
    this.randomFn = typeof randomFn === 'function' ? randomFn : Math.random;
    this.cache = cache || new BgmCache(wxApi);
    this.onNotice = typeof onNotice === 'function' ? onNotice : null;
    this.schedule = timers && timers.setTimeout || setTimeout;
    this.unschedule = timers && timers.clearTimeout || clearTimeout;
    this.audio = null;
    this.mode = 'random';
    this.currentIndex = -1;
    this.volume = 50;
    this.muted = false;
    this.destroyed = false;
    this.requestId = 0;
    this.activeLocalPath = '';
    this.repairCount = 0;
    this.prefetching = false;
    this.playFailed = false;
    this.awaitingPlay = false;
    this.playIssued = false;
    this.receivedOnPlay = false;
    this.supportsPlayEvent = false;
    this.startupRecovery = false;
    this.startupAttempts = 0;
    this.startupTimer = null;
    this.readyTimer = null;
  }

  start(mode, volume, muted) {
    if (this.destroyed || typeof this.wxApi.createInnerAudioContext !== 'function') return;
    this.mode = this.isValidMode(mode) ? mode : 'random';
    this.volume = this.clampVolume(volume);
    this.muted = !!muted;
    if (this.requestId > 0) return;
    this.startupRecovery = true;
    this.startupAttempts = 0;
    this.playSelected();
  }

  isValidMode(mode) {
    return mode === 'random' || PLAYLIST.some((song) => song.id === mode);
  }

  clampVolume(value) {
    return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 50;
  }

  pickRandomIndex() {
    if (PLAYLIST.length < 2 || this.currentIndex < 0) {
      return Math.min(PLAYLIST.length - 1, Math.floor(this.random() * PLAYLIST.length));
    }
    const next = Math.floor(this.random() * (PLAYLIST.length - 1));
    return next >= this.currentIndex ? next + 1 : next;
  }

  random() {
    const value = this.randomFn();
    return Number.isFinite(value) ? Math.max(0, Math.min(0.999999999, value)) : 0;
  }

  notice(message) {
    if (!this.onNotice) return;
    try { this.onNotice(message); } catch (_) { /* 提示异常不影响游戏 */ }
  }

  clearStartupTimer() {
    if (this.startupTimer !== null) this.unschedule(this.startupTimer);
    this.startupTimer = null;
  }

  clearReadyTimer() {
    if (this.readyTimer !== null) this.unschedule(this.readyTimer);
    this.readyTimer = null;
  }

  // 只销毁旧音频实例，不再对未加载 src 的实例调用 stop()。
  // 先断开 this.audio，再 destroy，防止销毁期间同步派发的事件影响新请求。
  releaseAudio() {
    const old = this.audio;
    this.audio = null;
    if (old && typeof old.destroy === 'function') {
      try { old.destroy(); } catch (error) { console.warn('[BGM] 释放旧音频失败:', error); }
    }
  }

  isActive(token, audio) {
    return !this.destroyed && token === this.requestId && this.audio === audio;
  }

  /** 为每个播放请求绑定自己的事件，旧请求的迟到事件直接忽略。 */
  createAudio(token) {
    const audio = this.wxApi.createInnerAudioContext();
    if (!audio) throw new Error('微信音频实例创建失败');
    this.audio = audio;
    audio.autoplay = false;
    audio.loop = this.mode !== 'random';
    this.applyVolume();
    this.supportsPlayEvent = typeof audio.onPlay === 'function';
    if (this.supportsPlayEvent) {
      audio.onPlay(() => {
        if (this.isActive(token, audio)) this.handleOnPlay(token);
      });
    }
    if (typeof audio.onTimeUpdate === 'function') {
      audio.onTimeUpdate(() => {
        if (this.isActive(token, audio) && this.awaitingPlay &&
            Number(audio.currentTime) >= 0.8) this.confirmPlayback();
      });
    }
    if (typeof audio.onEnded === 'function') {
      audio.onEnded(() => {
        if (!this.isActive(token, audio)) return;
        if (this.awaitingPlay) this.confirmPlayback();
        if (this.mode === 'random') this.playIndex(this.pickRandomIndex());
      });
    }
    if (typeof audio.onError === 'function') {
      audio.onError((error) => {
        if (this.isActive(token, audio)) this.handleAudioError(error, token);
      });
    }
    if (typeof audio.onCanplay === 'function') {
      audio.onCanplay(() => {
        if (this.isActive(token, audio)) this.beginPlayback(token, audio);
      });
    }
    return audio;
  }

  /** 当前本地文件就绪后只发出一次 play；没有 onCanplay 的环境直接播放。 */
  beginPlayback(token, audio) {
    if (!this.isActive(token, audio) || !this.awaitingPlay || this.playIssued) return;
    this.clearReadyTimer();
    this.playIssued = true;
    try {
      audio.play();
      this.watchStartupPlay(token);
      if (!this.supportsPlayEvent && !this.startupRecovery) this.prefetchRemaining();
    } catch (error) {
      this.handleAttemptFailure(error, token);
    }
  }

  /** 超时从实际调用 play 起计算，不把下载和等待 onCanplay 计入。 */
  watchStartupPlay(token) {
    if (!this.startupRecovery || !this.awaitingPlay || !this.supportsPlayEvent || this.receivedOnPlay) return;
    this.clearStartupTimer();
    this.startupTimer = this.schedule(() => {
      this.startupTimer = null;
      if (this.destroyed || token !== this.requestId || !this.awaitingPlay) return;
      const time = Number(this.audio && this.audio.currentTime);
      if (Number.isFinite(time) && time >= 0.8) this.confirmPlayback();
      else this.handleAttemptFailure(new Error('启动音频长时间没有开始播放'), token);
    }, STARTUP_PLAY_TIMEOUT_MS);
  }

  handleOnPlay(token) {
    if (!this.awaitingPlay || !this.audio || this.destroyed || token !== this.requestId) return;
    if (!this.startupRecovery) {
      this.confirmPlayback();
      return;
    }
    if (this.receivedOnPlay) return; // 重复 onPlay 不应不断延长稳定观察窗口
    this.receivedOnPlay = true;
    this.clearStartupTimer();
    this.startupTimer = this.schedule(() => {
      this.startupTimer = null;
      if (token === this.requestId && this.awaitingPlay) this.confirmPlayback();
    }, STARTUP_STABLE_MS);
  }

  confirmPlayback() {
    if (!this.awaitingPlay || this.destroyed) return;
    this.clearStartupTimer();
    this.clearReadyTimer();
    this.awaitingPlay = false;
    this.receivedOnPlay = false;
    this.playFailed = false;
    if (this.startupRecovery) {
      this.startupRecovery = false;
      if (this.startupAttempts > 1) this.notice('背景音乐已恢复');
      this.startupAttempts = 0;
    }
    this.prefetchRemaining();
  }

  playSelected() {
    const index = this.mode === 'random' ? this.pickRandomIndex()
      : PLAYLIST.findIndex((song) => song.id === this.mode);
    this.playIndex(index);
  }

  playIndex(index, repairing) {
    if (index < 0 || index >= PLAYLIST.length || this.destroyed) return;
    const token = ++this.requestId;
    this.clearStartupTimer();
    this.clearReadyTimer();
    this.releaseAudio();
    this.currentIndex = index;
    this.activeLocalPath = '';
    this.awaitingPlay = false;
    this.playIssued = false;
    this.receivedOnPlay = false;
    this.playFailed = false;
    if (this.startupRecovery) this.startupAttempts += 1;
    if (!repairing) this.repairCount = 0;

    this.cache.get(PLAYLIST[index]).then((path) => {
      if (this.destroyed || token !== this.requestId) return;
      try {
        const audio = this.createAudio(token);
        this.activeLocalPath = path;
        this.awaitingPlay = true;
        // 先监听 canplay，再设置 src，避免漏掉首次加载事件。
        if (typeof audio.onCanplay === 'function') {
          this.readyTimer = this.schedule(() => {
            this.readyTimer = null;
            this.beginPlayback(token, audio);
          }, AUDIO_READY_FALLBACK_MS);
        }
        audio.src = path;
        if (typeof audio.onCanplay !== 'function') this.beginPlayback(token, audio);
      } catch (error) {
        this.handleAttemptFailure(error, token);
      }
    }).catch((error) => this.handleAttemptFailure(error, token));
  }

  isDomainError(error) {
    return !!error && (error.errno === 600002 ||
      /url not in domain list/i.test(error.errMsg || error.message || ''));
  }

  handleAttemptFailure(error, token) {
    if (this.destroyed || token !== this.requestId || this.playFailed) return;
    const hadLocalFile = !!this.activeLocalPath;
    const failedIndex = this.currentIndex;
    this.playFailed = true;
    this.awaitingPlay = false;
    this.receivedOnPlay = false;
    this.clearStartupTimer();
    this.clearReadyTimer();
    this.releaseAudio();
    console.warn('[BGM] 音乐加载/播放失败:', PLAYLIST[failedIndex].name,
      error && (error.errMsg || error.message || error));

    if (this.startupRecovery) {
      if (!this.isDomainError(error) && this.startupAttempts < STARTUP_MAX_ATTEMPTS) {
        if (this.startupAttempts === 1) this.notice('背景音乐播放失败，正在重试');
        this.startupTimer = this.schedule(() => {
          this.startupTimer = null;
          if (!this.destroyed && token === this.requestId && this.startupRecovery) this.playSelected();
        }, STARTUP_RETRY_DELAY_MS);
      } else {
        this.startupRecovery = false;
        this.notice('背景音乐暂不可用，请稍后重试');
      }
      return;
    }

    // 仅在启动期结束后，保留既有的一次缓存修复策略。
    if (!hadLocalFile || this.repairCount >= 1 || failedIndex < 0) return;
    this.activeLocalPath = '';
    this.repairCount += 1;
    this.cache.invalidate(PLAYLIST[failedIndex]);
    this.playIndex(failedIndex, true);
  }

  handleAudioError(error, token) {
    if (this.destroyed || (!this.awaitingPlay && !this.activeLocalPath)) return;
    this.handleAttemptFailure(error, token);
  }

  prefetchRemaining() {
    if (this.prefetching || this.destroyed || this.mode !== 'random') return;
    this.prefetching = true;
    const current = this.currentIndex;
    const others = PLAYLIST.filter((_, i) => i !== current);
    const preload = async () => {
      for (const song of others) {
        if (this.destroyed || this.mode !== 'random') break;
        try { await this.cache.get(song); } catch (error) {
          console.warn('[BGM] 预缓存失败，稍后选中时再试:', song.name, error);
        }
      }
      this.prefetching = false;
    };
    preload().catch(() => { this.prefetching = false; });
  }

  select(mode) {
    if (!this.isValidMode(mode)) return false;
    if (this.mode === mode && !this.playFailed) return false;
    this.startupRecovery = false;
    this.startupAttempts = 0;
    this.clearStartupTimer();
    this.clearReadyTimer();
    this.mode = mode;
    this.playSelected();
    return true;
  }

  setVolume(volume, muted) {
    this.volume = this.clampVolume(volume);
    this.muted = !!muted;
    this.applyVolume();
  }

  applyVolume() {
    if (this.audio) this.audio.volume = this.muted ? 0 : this.volume / 100;
  }

  destroy() {
    this.destroyed = true;
    ++this.requestId;
    this.clearStartupTimer();
    this.clearReadyTimer();
    this.releaseAudio();
  }
}

module.exports = BgmManager;
