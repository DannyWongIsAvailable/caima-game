const CONFIG = require('../config/game-config');

/**
 * 非资源动画：简单的亮码渐显。后续可在 Renderer 中换成 spritesheet。
 * 只在出码后驱动 ~360ms，不持续占用帧循环。
 */
class RevealAnimator {
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
      const fraction = Math.min(1, (Date.now() - startedAt) / CONFIG.REVEAL_MS);
      const eased = 1 - Math.pow(1 - fraction, 3);
      onFrame(eased);
      if (fraction < 1) {
        this.frameId = this.request(tick);
      } else {
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

module.exports = RevealAnimator;
