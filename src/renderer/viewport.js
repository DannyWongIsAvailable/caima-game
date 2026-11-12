const CONFIG = require('../config/game-config');

/**
 * 保证画布清晰并等比适配：绘制坐标固定 375 x 720。
 * 无论手机 DPR、屏幕比例如何，点击的区域与渲染使用同一套坐标。
 */
class Viewport {
  constructor(wxApi, canvas) {
    this.wxApi = wxApi;
    this.canvas = canvas;
    this.update();
  }

  update() {
    const info = this.wxApi.getWindowInfo ? this.wxApi.getWindowInfo() : this.wxApi.getSystemInfoSync();
    this.width = info.windowWidth || info.screenWidth || 375;
    this.height = info.windowHeight || info.screenHeight || 720;
    this.dpr = Math.max(1, info.pixelRatio || 1);
    const safe = info.safeArea || {};
    // 有些旧版环境没有 safeArea：保留默认高度即可。
    const safeTop = Math.max(0, Math.min(this.height, Number(safe.top) || 0));
    const safeBottom = Math.max(safeTop + 1, Math.min(this.height, Number(safe.bottom) || this.height));
    const usableHeight = safeBottom - safeTop;
    this.scale = Math.min(this.width / CONFIG.DESIGN_WIDTH, usableHeight / CONFIG.DESIGN_HEIGHT);
    this.offsetX = (this.width - CONFIG.DESIGN_WIDTH * this.scale) / 2;
    this.offsetY = safeTop + (usableHeight - CONFIG.DESIGN_HEIGHT * this.scale) / 2;
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
  }

  toDesignPoint(x, y) {
    return {
      x: (x - this.offsetX) / this.scale,
      y: (y - this.offsetY) / this.scale
    };
  }

  useFullScreen(ctx) {
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  useDesignSpace(ctx) {
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);
  }
}

module.exports = Viewport;
