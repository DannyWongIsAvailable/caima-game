const theme = require('./tokens');
const { SKINS, findSkin, DEFAULT_SKIN_ID } = require('./skins');
const Storage = require('../core/storage');

const STORAGE_KEY = 'guangxi_caima_skin_v1';

/** 在同一个 colors 对象上更新调色板，保证 Renderer/UI 持有的引用同步变更。 */
class SkinManager {
  constructor(wxApi, storage) {
    this.storage = storage || new Storage(wxApi);
    const savedId = this.storage.get(STORAGE_KEY, DEFAULT_SKIN_ID);
    this.id = findSkin(savedId) ? savedId : DEFAULT_SKIN_ID;
    this.apply(this.id);
  }

  list() { return SKINS; }
  current() { return findSkin(this.id); }

  apply(id) {
    const skin = findSkin(id);
    if (!skin) return false;
    this.id = id;
    // 注意：不能直接令 theme.colors = skin.colors，否则顶部引用失效。
    // 每次切换都初始化可选语义色，避免从浅色皮肤切回其他皮肤时色值残留。
    Object.assign(theme.colors, {
      buttonSurface: skin.colors.surfaceRaised,
      buttonText: skin.colors.primaryText,
      navSurface: skin.colors.surface,
      homeTitleText: skin.colors.accent,
      aiCallText: skin.colors.accent,
      selectedIndicator: skin.colors.accent
    }, skin.colors);
    return true;
  }

  select(id) {
    if (!findSkin(id)) return false;
    if (id === this.id) return true;
    this.apply(id);
    this.storage.set(STORAGE_KEY, id);
    return true;
  }
}

module.exports = SkinManager;
