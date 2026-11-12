const CONFIG = require('../config/game-config');

/**
 * 首页入场动画：标题渐入、人物侧面入场、气泡文案显现。
 * 与开码动画分离，便于首页复用和单独停用。
 */
class HomeIntroAnimator {
  constructor(canvas) {
    const globalRaf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null;
    const globalCancel = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : null;
    this.request = (canvas.requestAnimationFrame && canvas.requestAnimationFrame.bind(canvas)) || globalRaf || ((fn) => setTimeout(fn, 16));
    this.cancel = (canvas.cancelAnimationFrame && canvas.cancelAnimationFrame.bind(canvas)) || globalCancel || clearTimeout;
    this.frameId = null;
    this.running = false;
  }

  play(onFrame, onComplete) {
    this.stop();
    this.running = true;
    const startedAt = Date.now();
    const tick = () => {
      if (!this.running) return;
      const fraction = Math.min(1, (Date.now() - startedAt) / CONFIG.HOME_INTRO_MS);
      // 传入线性时间，让标题/人物/气泡各自按时间段缓动，避免提前结束。
      onFrame(fraction);
      if (fraction < 1) this.frameId = this.request(tick);
      else {
        this.running = false;
        this.frameId = null;
        if (onComplete) onComplete();
      }
    };
    onFrame(0);
    this.frameId = this.request(tick);
  }

  stop() {
    this.running = false;
    if (this.frameId !== null) this.cancel(this.frameId);
    this.frameId = null;
  }
}

module.exports = HomeIntroAnimator;
