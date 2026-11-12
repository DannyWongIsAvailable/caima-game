/** 原生微信小游戏触摸事件，触点统一换算为设计坐标。 */
class TouchController {
  constructor(wxApi, viewport, hitTest, onAction) {
    this.wxApi = wxApi;
    this.viewport = viewport;
    this.hitTest = hitTest;
    this.onAction = onAction;
    this.activeSlider = null;
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleTouchCancel = this.handleTouchCancel.bind(this);
  }

  mount() {
    if (typeof this.wxApi.onTouchStart === 'function') {
      this.wxApi.onTouchStart(this.handleTouchStart);
    }
    if (typeof this.wxApi.onTouchMove === 'function') {
      this.wxApi.onTouchMove(this.handleTouchMove);
    }
    this.wxApi.onTouchEnd(this.handleTouchEnd);
    if (typeof this.wxApi.onTouchCancel === 'function') {
      this.wxApi.onTouchCancel(this.handleTouchCancel);
    }
  }

  getPoint(event) {
    const touch = (event.changedTouches && event.changedTouches[0]) || (event.touches && event.touches[0]);
    if (!touch) return null;
    const x = Number.isFinite(touch.clientX) ? touch.clientX : touch.pageX;
    const y = Number.isFinite(touch.clientY) ? touch.clientY : touch.pageY;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return this.viewport.toDesignPoint(x, y);
  }

  handleTouchStart(event) {
    const point = this.getPoint(event);
    if (!point) return;
    const action = this.hitTest(point.x, point.y);
    if (!action || action.type !== 'SET_VOLUME') return;
    // 开始拖动后固定本条轨道，即便滑出原点击区域也可以拖到两端。
    this.activeSlider = {
      channel: action.channel, trackX: action.trackX, trackWidth: action.trackWidth
    };
    this.updateSlider(point.x);
  }

  handleTouchMove(event) {
    if (!this.activeSlider) return;
    const point = this.getPoint(event);
    if (point) this.updateSlider(point.x);
  }

  updateSlider(x) {
    const slider = this.activeSlider;
    if (!slider) return;
    const value = Math.max(0, Math.min(100,
      Math.round((x - slider.trackX) * 100 / slider.trackWidth)));
    this.onAction({ type: 'SET_VOLUME', channel: slider.channel, value });
  }

  handleTouchEnd(event) {
    const point = this.getPoint(event);
    if (this.activeSlider) {
      if (point) this.updateSlider(point.x);
      this.activeSlider = null;
      return; // 不将滑动结束误判成音量图标/其他按钮点击。
    }
    if (!point) return;
    const action = this.hitTest(point.x, point.y);
    if (action) this.onAction(action);
  }

  handleTouchCancel() {
    this.activeSlider = null;
  }

  unmount() {
    this.activeSlider = null;
    if (typeof this.wxApi.offTouchStart === 'function') {
      this.wxApi.offTouchStart(this.handleTouchStart);
    }
    if (typeof this.wxApi.offTouchMove === 'function') {
      this.wxApi.offTouchMove(this.handleTouchMove);
    }
    if (typeof this.wxApi.offTouchEnd === 'function') {
      this.wxApi.offTouchEnd(this.handleTouchEnd);
    }
    if (typeof this.wxApi.offTouchCancel === 'function') {
      this.wxApi.offTouchCancel(this.handleTouchCancel);
    }
  }
}

module.exports = TouchController;
