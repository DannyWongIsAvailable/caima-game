const CONFIG = require('./config/game-config');
const GameModel = require('./core/game-model');
const Viewport = require('./renderer/viewport');
const CanvasRenderer = require('./renderer/canvas-renderer');
const TouchController = require('./input/touch-controller');
const ImageLoader = require('./media/image-loader');
const AudioManager = require('./media/audio-manager');
const RevealAnimator = require('./animation/reveal-animator');
const HomeIntroAnimator = require('./animation/home-intro-animator');
const SkinManager = require('./theme/skin-manager');

/** 控制器：接收触摸 -> 选择出拳 -> 选择喊码自动结算 -> 自动下一码。 */
class MiniGameApp {
  constructor(wxApi, options) {
    const opts = options || {};
    this.wxApi = wxApi;
    this.canvas = wxApi.createCanvas();
    this.viewport = new Viewport(wxApi, this.canvas);
    this.model = new GameModel(opts.randomFn);
    this.skinManager = new SkinManager(wxApi);
    this.uiPage = 'home';
    // 音量设置在当前 MVP 仅保存于内存，供设置页展示与交互，不控制 AudioManager。
    this.soundSettings = {
      music: { volume: 50, muted: false },
      effects: { volume: 100, muted: false }
    };
    // 统一弹窗状态：玩法说明和本局记录共享同一套分页/关闭交互。
    this.dialog = null;
    this.images = new ImageLoader(wxApi, () => this.render());
    this.audio = new AudioManager(wxApi);
    this.animator = new RevealAnimator(this.canvas);
    this.homeIntroAnimator = new HomeIntroAnimator(this.canvas);
    this.renderer = new CanvasRenderer(this.canvas, this.viewport, this.images);
    this.touch = new TouchController(
      wxApi,
      this.viewport,
      (x, y) => this.renderer.hitTest(x, y),
      (action) => this.dispatch(action)
    );
    // 可注入定时器，便于在不等待真实时间的情况下测试自动下一轮。
    this.schedule = opts.setTimeout || setTimeout;
    this.unschedule = opts.clearTimeout || clearTimeout;
    this.autoNextTimer = null;
    this.revealProgress = 1;
    this.animating = false;
    this.homeIntro = { progress: 1, playing: false };
    // 出码动画期间暂存上一轮手势，让它收回时新手势从顶部伸出。
    this.previousAiFist = null;
    this.mounted = false;
    this.handleResize = () => {
      this.viewport.update();
      this.render();
    };
  }

  mount() {
    this.mounted = true;
    this.images.loadEnabled();
    this.images.loadSkin(this.skinManager.current());
    this.images.loadSkinPreviews(this.skinManager.list());
    this.audio.prepare();
    this.touch.mount();
    this.startHomeIntro();
    this.render();
    if (typeof this.wxApi.onWindowResize === 'function') {
      this.wxApi.onWindowResize(this.handleResize);
    }
  }

  render() {
    this.renderer.render(this.model, this.revealProgress, this.animating,
      this.previousAiFist, this.uiPage, this.skinManager.id, this.homeIntro, this.dialog,
      this.soundSettings);
  }

  dispatch(action) {
    if (!action || !this.mounted) return;
    // 返回首页可以中断伸手动画和下一轮计时，防止隐藏的回调修改首页。
    if (action.type === 'RETURN_HOME') {
      if (this.model.phase === 'home') return;
      this.clearAutoNext();
      this.animator.stop();
      this.animating = false;
      this.previousAiFist = null;
      this.revealProgress = 1;
      this.model.reset();
      this.dialog = null;
      this.uiPage = 'home';
      this.audio.play('tap');
      this.startHomeIntro();
      this.render();
      return;
    }
    // 弹窗开启时，只处理弹窗内的关闭/翻页，禁止操作底下的出拳、喊码或首页按钮。
    if (this.dialog) {
      switch (action.type) {
        case 'CLOSE_DIALOG':
          this.dialog = null;
          break;
        case 'DIALOG_PREV':
          this.dialog.page = Math.max(0, this.dialog.page - 1);
          break;
        case 'DIALOG_NEXT':
          this.dialog.page += 1;
          break;
        default:
          return;
      }
      this.audio.play('tap');
      this.render();
      return;
    }
    // 出码动画可正常继续；记录弹窗也能在动画期间打开，不会中断本轮结算。
    if (this.animating && action.type !== 'OPEN_HISTORY') return;
    switch (action.type) {
      case 'OPEN_RULES':
        if (this.model.phase !== 'home' || this.uiPage !== 'home') return;
        this.dialog = { type: 'rules', page: 0 };
        this.stopHomeIntro(true);
        this.audio.play('tap');
        break;
      case 'OPEN_HISTORY':
        if (this.model.phase === 'home') return;
        this.dialog = { type: 'history', page: 0 };
        this.audio.play('tap');
        break;
      case 'OPEN_SETTINGS':
        if (this.model.phase !== 'home' || this.uiPage !== 'home') return;
        this.uiPage = 'settings';
        this.stopHomeIntro(true);
        this.audio.play('tap');
        break;
      case 'CLOSE_SETTINGS':
        if (this.model.phase !== 'home' || this.uiPage !== 'settings') return;
        this.uiPage = 'home';
        this.audio.play('tap');
        this.startHomeIntro();
        break;
      case 'OPEN_SKINS':
        if (this.model.phase !== 'home' || this.uiPage !== 'settings') return;
        this.uiPage = 'skins';
        this.audio.play('tap');
        break;
      case 'SET_VOLUME': {
        if (this.model.phase !== 'home' || this.uiPage !== 'settings') return;
        const state = this.soundSettings[action.channel];
        if (!state || !Number.isFinite(action.value)) return;
        state.volume = Math.max(0, Math.min(100, Math.round(action.value)));
        state.muted = false; // 移动滑杆解除手动静音；0% 自动展示 no-audio 图标。
        break;
      }
      case 'TOGGLE_VOLUME_MUTE': {
        if (this.model.phase !== 'home' || this.uiPage !== 'settings') return;
        const state = this.soundSettings[action.channel];
        if (!state) return;
        state.muted = !state.muted; // 显示 mute 图标，不修改滑杆数值。
        break;
      }
      case 'CLOSE_SKINS':
        if (this.model.phase !== 'home' || this.uiPage !== 'skins') return;
        this.uiPage = 'settings';
        this.audio.play('tap');
        break;
      case 'SELECT_SKIN':
        if (this.model.phase !== 'home' || this.uiPage !== 'skins') return;
        if (!this.skinManager.select(action.id)) return;
        this.images.loadSkin(this.skinManager.current());
        this.audio.play('tap');
        break;
      case 'START':
        if ((this.model.phase !== 'home' && this.model.phase !== 'over') || this.uiPage !== 'home') return;
        this.clearAutoNext();
        this.stopHomeIntro(true);
        this.model.start();
        this.dialog = null;
        this.previousAiFist = null;
        this.revealProgress = 1;
        this.audio.play('tap');
        break;
      case 'FIST':
        if (!this.model.selectFist(action.value)) return;
        this.audio.play('tap');
        break;
      case 'CALL':
        if (!this.model.selectCall(action.value)) return;
        this.audio.play('tap');
        // 玩家选择第二项后立即结算，不需要点击出码确认。
        this.resolveRound();
        return;
      default:
        return;
    }
    this.revealProgress = 1;
    this.render();
  }

  startHomeIntro() {
    this.homeIntroAnimator.stop();
    this.homeIntro.progress = 0;
    this.homeIntro.playing = true;
    this.homeIntroAnimator.play(
      (progress) => {
        if (!this.mounted) return;
        this.homeIntro.progress = progress;
        this.homeIntro.playing = progress < 1;
        this.render();
      },
      () => {
        if (!this.mounted) return;
        this.homeIntro.progress = 1;
        this.homeIntro.playing = false;
        this.render();
      }
    );
  }

  stopHomeIntro(complete) {
    this.homeIntroAnimator.stop();
    this.homeIntro.progress = complete ? 1 : 0;
    this.homeIntro.playing = false;
  }

  resolveRound() {
    // 在 submit 更新 lastResult 前记住上一轮的手势。
    // 新喊码立即更新；旧手势收回，新手势同步从顶部伸出。
    const previous = this.model.lastResult;
    const result = this.model.submit();
    if (!result) return;
    this.previousAiFist = previous ? previous.ai.fist : null;
    this.revealProgress = 0;
    this.animating = true;
    this.render();
    this.audio.play('reveal');
    this.animator.play(
      (progress) => {
        if (!this.mounted) return;
        this.revealProgress = progress;
        this.render();
      },
      () => {
        if (!this.mounted) return;
        this.animating = false;
        this.revealProgress = 1;
        this.previousAiFist = null;
        const sound = result.outcome === 'player' ? 'win' : result.outcome === 'ai' ? 'lose' : 'draw';
        this.audio.play(sound);
        this.render();
        // 本局结束时必须停在结算画面，供玩家手动点击「再玩一局」。
        if (this.model.phase === 'result') this.queueNextRound();
      }
    );
  }

  queueNextRound() {
    this.clearAutoNext();
    this.autoNextTimer = this.schedule(() => {
      this.autoNextTimer = null;
      if (!this.mounted || this.model.phase !== 'result') return;
      this.model.nextRound();
      this.revealProgress = 1;
      this.render();
    }, CONFIG.AUTO_NEXT_MS);
  }

  clearAutoNext() {
    if (this.autoNextTimer !== null) this.unschedule(this.autoNextTimer);
    this.autoNextTimer = null;
  }

  destroy() {
    this.mounted = false;
    this.clearAutoNext();
    this.animator.stop();
    this.homeIntroAnimator.stop();
    this.touch.unmount();
    this.audio.destroy();
    if (typeof this.wxApi.offWindowResize === 'function') {
      this.wxApi.offWindowResize(this.handleResize);
    }
  }
}

module.exports = MiniGameApp;
