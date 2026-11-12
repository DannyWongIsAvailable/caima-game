/** 原生微信小游戏触摸事件，触点统一换算为设计坐标。 */
class TouchController {
  constructor(wxApi, viewport, hitTest, onAction) {
    this.wxApi = wxApi;
    this.viewport = viewport;
    this.hitTest = hitTest;
    this.onAction = onAction;
    this.handleTouch = this.handleTouch.bind(this);
  }

  mount() {
    this.wxApi.onTouchEnd(this.handleTouch);
  }

  handleTouch(event) {
    const touch = (event.changedTouches && event.changedTouches[0]) || (event.touches && event.touches[0]);
    if (!touch) return;
    const x = Number.isFinite(touch.clientX) ? touch.clientX : touch.pageX;
    const y = Number.isFinite(touch.clientY) ? touch.clientY : touch.pageY;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const point = this.viewport.toDesignPoint(x, y);
    const action = this.hitTest(point.x, point.y);
    if (action) this.onAction(action);
  }

  unmount() {
    if (typeof this.wxApi.offTouchEnd === 'function') {
      this.wxApi.offTouchEnd(this.handleTouch);
    }
  }
}

module.exports = TouchController;
