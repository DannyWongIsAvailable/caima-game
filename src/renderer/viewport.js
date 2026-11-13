const CONFIG = require('../config/game-config');

/**
 * UI 使用 375 逻辑宽度，内容高度随安全区域变化。
 * 过矮/横屏时至少保留 620 逻辑高度，并在两侧居中留白，避免按钮挤压。
 * DPR 仅决定 Canvas 像素数；触摸和绘制使用同一逻辑变换。
 */
class Viewport {
  constructor(wxApi, canvas) {
    this.wxApi = wxApi;
    this.canvas = canvas;
    this.update();
  }

  update() {
    const info = this.wxApi.getWindowInfo ? this.wxApi.getWindowInfo() : this.wxApi.getSystemInfoSync();
    this.width = Math.max(1, info.windowWidth || info.screenWidth || 375);
    this.height = Math.max(1, info.windowHeight || info.screenHeight || 720);
    this.dpr = Math.max(1, info.pixelRatio || 1);
    const safe = info.safeArea || {};
    const safeTop = Math.max(0, Math.min(this.height - 1, Number(safe.top) || 0));
    const safeBottom = Number.isFinite(Number(safe.bottom)) && Number(safe.bottom) > safeTop
      ? Math.min(this.height, Number(safe.bottom)) : this.height;
    this.safeTop = safeTop;
    this.safeBottom = Math.max(safeTop + 1, safeBottom);
    const usableHeight = this.safeBottom - this.safeTop;

    this.scale = Math.min(this.width / CONFIG.DESIGN_WIDTH, usableHeight / 620);
    this.designHeight = usableHeight / this.scale;
    this.designWidthFull = this.width / this.scale;
    this.contentInsetX = (this.designWidthFull - CONFIG.DESIGN_WIDTH) / 2;
    this.offsetX = this.contentInsetX * this.scale;
    this.offsetY = this.safeTop;
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
