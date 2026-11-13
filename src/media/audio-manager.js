const manifest = require('./media-manifest');

/** 没有音频资源时所有 play() 都会静默跳过。 */
class AudioManager {
  constructor(wxApi) {
    this.wxApi = wxApi;
    this.sounds = Object.create(null);
    this.volume = 100;
    this.muted = false;
  }

  setVolume(volume, muted) {
    this.volume = Number.isFinite(volume) ? Math.max(0, Math.min(100, volume)) : 100;
    this.muted = !!muted;
    Object.keys(this.sounds).forEach((key) => {
      this.sounds[key].volume = this.muted ? 0 : this.volume / 100;
    });
  }

  prepare() {
    Object.keys(manifest.audio).forEach((key) => {
      const config = manifest.audio[key];
      if (!config.enabled || !config.src || !this.wxApi.createInnerAudioContext) return;
      const audio = this.wxApi.createInnerAudioContext();
      audio.autoplay = false;
      audio.volume = this.muted ? 0 : this.volume / 100;
      audio.src = config.src;
      if (typeof audio.onError === 'function') {
        audio.onError(() => console.warn('[媒体] 音频不可用:', config.src));
      }
      this.sounds[key] = audio;
    });
  }

  play(key) {
    const audio = this.sounds[key];
    if (!audio) return;
    try {
      if (typeof audio.stop === 'function') audio.stop();
      audio.play();
    } catch (error) {
      console.warn('[媒体] 音频播放失败:', key, error);
    }
  }

  destroy() {
    Object.keys(this.sounds).forEach((key) => {
      const audio = this.sounds[key];
      if (typeof audio.destroy === 'function') audio.destroy();
    });
    this.sounds = Object.create(null);
  }
}

module.exports = AudioManager;
