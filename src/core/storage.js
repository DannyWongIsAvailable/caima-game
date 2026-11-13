/** 微信小游戏本地存储统一封装：不可用或读取失败时采用默认值。 */
class Storage {
  constructor(wxApi) {
    this.wxApi = wxApi;
  }

  get(key, fallback) {
    if (typeof this.wxApi.getStorageSync !== 'function') return fallback;
    try {
      const value = this.wxApi.getStorageSync(key);
      return value === undefined || value === null || value === '' ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }

  set(key, value) {
    if (typeof this.wxApi.setStorageSync !== 'function') return false;
    try {
      this.wxApi.setStorageSync(key, value);
      return true;
    } catch (_) {
      return false;
    }
  }
}

module.exports = Storage;
