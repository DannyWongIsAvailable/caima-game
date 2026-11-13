/** 原生微信小游戏触摸事件：记录起始目标，只有同一目标内松手才触发操作。 */
class TouchController {
  constructor(wxApi, viewport, hitTestTarget, onAction, onPressChange) {
    this.wxApi = wxApi;
    this.viewport = viewport;
    this.hitTestTarget = hitTestTarget;
    this.onAction = onAction;
    this.onPressChange = onPressChange || (() => {});
    this.activeTouchId = null;
    this.tracking = false;
    this.pressedTarget = null;
    this.activeSlider = null;
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleTouchCancel = this.handleTouchCancel.bind(this);
  }

  mount() {
    if (typeof this.wxApi.onTouchStart === 'function') this.wxApi.onTouchStart(this.handleTouchStart);
    if (typeof this.wxApi.onTouchMove === 'function') this.wxApi.onTouchMove(this.handleTouchMove);
    this.wxApi.onTouchEnd(this.handleTouchEnd);
    if (typeof this.wxApi.onTouchCancel === 'function') this.wxApi.onTouchCancel(this.handleTouchCancel);
  }

  /** 只接收正在追踪的手指；另一只手松开不能意外激活按钮。 */
  getTouch(event, listName, identifier) {
    const touches = event && event[listName];
    if (!touches || !touches.length) return null;
    if (identifier == null) return touches[0];
    for (let i = 0; i < touches.length; i += 1) {
      if (touches[i].identifier === identifier) return touches[i];
    }
    return null;
  }

  getPoint(touch) {
    if (!touch) return null;
    const x = Number.isFinite(touch.clientX) ? touch.clientX : touch.pageX;
    const y = Number.isFinite(touch.clientY) ? touch.clientY : touch.pageY;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return this.viewport.toDesignPoint(x, y);
  }

  inside(point, target) {
    return !!point && !!target &&
      point.x >= target.x && point.x <= target.x + target.width &&
      point.y >= target.y && point.y <= target.y + target.height;
  }

  /** hitTestTarget 只负责返回已绘制目标；不能根据松手处临时换成别的按钮。 */
  isSameTarget(point, target) {
    if (!this.inside(point, target)) return false;
    const current = this.hitTestTarget(point.x, point.y);
    return !!current && current.id === target.id;
  }

  handleTouchStart(event) {
    if (this.tracking) return;
    const touch = this.getTouch(event, 'changedTouches', null) || this.getTouch(event, 'touches', null);
    const point = this.getPoint(touch);
    if (!point) return;
    this.tracking = true;
    this.activeTouchId = touch.identifier == null ? null : touch.identifier;
    const target = this.hitTestTarget(point.x, point.y);
    if (!target) return;
    if (target.action.type === 'SET_VOLUME') {
      // 滑杆仍固定起始轨道，支持拖动到两端，不按普通按钮进行触发。
      this.activeSlider = { channel: target.action.channel,
        trackX: target.action.trackX, trackWidth: target.action.trackWidth };
      this.onPressChange(target.id);
      this.updateSlider(point.x);
      return;
    }
    this.pressedTarget = target;
    this.onPressChange(target.id);
  }

  handleTouchMove(event) {
    if (!this.tracking) return;
    const touch = this.getTouch(event, 'touches', this.activeTouchId) ||
      this.getTouch(event, 'changedTouches', this.activeTouchId);
    const point = this.getPoint(touch);
    if (!point) return;
    if (this.activeSlider) {
      this.updateSlider(point.x);
    } else if (this.pressedTarget) {
      this.onPressChange(this.isSameTarget(point, this.pressedTarget) ? this.pressedTarget.id : null);
    }
  }

  updateSlider(x) {
    const slider = this.activeSlider;
    if (!slider) return;
    const value = Math.max(0, Math.min(100,
      Math.round((x - slider.trackX) * 100 / slider.trackWidth)));
    this.onAction({ type: 'SET_VOLUME', channel: slider.channel, value });
  }

  handleTouchEnd(event) {
    if (!this.tracking) return;
    const touch = this.getTouch(event, 'changedTouches', this.activeTouchId);
    // 如果尚有标识符的第一根手指没松开，忽略其他手指的结束事件。
    if (!touch) return;
    const point = this.getPoint(touch);
    const target = this.pressedTarget;
    const slider = this.activeSlider;
    const activate = !!target && this.isSameTarget(point, target);
    this.reset();
    if (slider) {
      if (point) {
        const value = Math.max(0, Math.min(100,
          Math.round((point.x - slider.trackX) * 100 / slider.trackWidth)));
        this.onAction({ type: 'SET_VOLUME', channel: slider.channel, value });
      }
    } else if (activate) {
      this.onAction(target.action);
    }
  }

  handleTouchCancel(event) {
    if (!this.tracking) return;
    if (event && event.changedTouches && event.changedTouches.length && this.activeTouchId != null &&
      !this.getTouch(event, 'changedTouches', this.activeTouchId)) return;
    this.reset();
  }

  reset() {
    this.tracking = false;
    this.activeTouchId = null;
    this.pressedTarget = null;
    this.activeSlider = null;
    this.onPressChange(null);
  }

  unmount() {
    this.reset();
    if (typeof this.wxApi.offTouchStart === 'function') this.wxApi.offTouchStart(this.handleTouchStart);
    if (typeof this.wxApi.offTouchMove === 'function') this.wxApi.offTouchMove(this.handleTouchMove);
    if (typeof this.wxApi.offTouchEnd === 'function') this.wxApi.offTouchEnd(this.handleTouchEnd);
    if (typeof this.wxApi.offTouchCancel === 'function') this.wxApi.offTouchCancel(this.handleTouchCancel);
  }
}

module.exports = TouchController;
