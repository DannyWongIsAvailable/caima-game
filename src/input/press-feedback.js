/**
 * 轻量 Canvas 按压反馈：同一时刻只追踪一个按钮，按下立即可见，松开平滑回弹。
 * 不参与点击判定或业务派发，动画只在状态改变期间占用帧循环。
 */
class PressFeedback {
  constructor(canvas, invalidate) {
    const globalRequest = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null;
    const globalCancel = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : null;
    this.request = (canvas.requestAnimationFrame && canvas.requestAnimationFrame.bind(canvas)) ||
      globalRequest || ((fn) => setTimeout(fn, 16));
    this.cancel = (canvas.cancelAnimationFrame && canvas.cancelAnimationFrame.bind(canvas)) ||
      globalCancel || clearTimeout;
    this.invalidate = invalidate;
    this.scope = null;
    this.pressedId = null;
    this.current = null;
    this.frameId = null;
    this.tick = this.tick.bind(this);
  }

  /** 离开场景/弹窗时立即抛弃旧反馈，避免跨页面残留。 */
  setScope(scope) {
    if (this.scope === scope) return;
    this.clear();
    this.scope = scope;
  }

  setPressed(id) {
    const nextId = id || null;
    if (this.pressedId === nextId) return;
    this.advance(Date.now());
    this.pressedId = nextId;
    if (nextId) {
      // 先显示约 70% 按下效果，确保快速点击也能在首帧看到反馈。
      this.current = { id: nextId, value: 0.7, from: 0.7, to: 1,
        startedAt: Date.now(), duration: 75 };
    } else if (this.current) {
      this.current.from = this.current.value;
      this.current.to = 0;
      this.current.startedAt = Date.now();
      this.current.duration = 125;
    }
    this.invalidate();
    this.scheduleFrame();
  }

  getProgress(id) {
    return this.current && this.current.id === id ? this.current.value : 0;
  }

  advance(now) {
    if (!this.current) return;
    const state = this.current;
    const t = Math.max(0, Math.min(1, (now - state.startedAt) / state.duration));
    const eased = 1 - Math.pow(1 - t, 3);
    state.value = state.from + (state.to - state.from) * eased;
    if (t >= 1 && state.to === 0) this.current = null;
  }

  scheduleFrame() {
    if (this.current && this.frameId === null) this.frameId = this.request(this.tick);
  }

  tick() {
    this.frameId = null;
    this.advance(Date.now());
    this.invalidate();
    if (this.current && Math.abs(this.current.value - this.current.to) > 0.001) {
      this.scheduleFrame();
    }
  }

  clear() {
    if (this.frameId !== null) this.cancel(this.frameId);
    this.frameId = null;
    this.pressedId = null;
    this.current = null;
  }
}

module.exports = PressFeedback;
