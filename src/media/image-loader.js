const manifest = require('./media-manifest');

/** 手势/动画资源按原有配置加载；皮肤背景按需加载，缩略图轻量预加载。 */
class ImageLoader {
  constructor(wxApi, onChange) {
    this.wxApi = wxApi;
    this.onChange = onChange || function () {};
    this.cache = Object.create(null);
    this.loading = Object.create(null);
    this.activeSkinId = null;
    this.skinRequestId = 0;
  }

  loadImage(key, src) {
    if (!src || this.cache[key] || this.loading[key] || typeof this.wxApi.createImage !== 'function') return;
    const image = this.wxApi.createImage();
    this.loading[key] = image;
    image.onload = () => {
      delete this.loading[key];
      this.cache[key] = image;
      this.onChange();
    };
    image.onerror = () => {
      delete this.loading[key];
      console.warn('[媒体] 图片加载失败:', src);
      this.onChange();
    };
    image.src = src;
  }

  loadEnabled() {
    Object.keys(manifest.images).forEach((key) => {
      const spec = manifest.images[key];
      if (spec.enabled && spec.src) this.loadImage(key, spec.src);
    });
  }

  /** 只保留当前选中的一张大背景，减少手机内存占用；防止快速换肤异步串图。 */
  loadSkin(skin) {
    if (!skin) return;
    if (this.activeSkinId === skin.id && (this.cache.skinBackground || this.loading.skinBackground)) return;
    this.activeSkinId = skin.id;
    this.skinRequestId += 1;
    const requestId = this.skinRequestId;
    delete this.cache.skinBackground;
    if (typeof this.wxApi.createImage !== 'function') return;
    const image = this.wxApi.createImage();
    this.loading.skinBackground = image;
    image.onload = () => {
      if (requestId !== this.skinRequestId) return;
      delete this.loading.skinBackground;
      this.cache.skinBackground = image;
      this.onChange();
    };
    image.onerror = () => {
      if (requestId !== this.skinRequestId) return;
      delete this.loading.skinBackground;
      console.warn('[皮肤] 图片加载失败，使用配色渐变:', skin.background);
      this.onChange();
    };
    image.src = skin.background;
  }

  loadSkinPreviews(skins) {
    skins.forEach((skin) => this.loadImage('skinPreview_' + skin.id, skin.preview));
  }

  getSkinBackground(id) {
    return id === this.activeSkinId ? this.cache.skinBackground || null : null;
  }

  get(name) { return this.cache[name] || null; }
}

module.exports = ImageLoader;
