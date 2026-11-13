const Storage = require('../core/storage');

const MIN_AUDIO_BYTES = 64 * 1024;
const MAX_AUDIO_BYTES = 30 * 1024 * 1024;
const CACHE_FOLDER = 'caima-bgm';
const META_PREFIX = 'guangxi_caima_bgm_file_v1_';

/**
 * R2 MP3 的本地持久缓存。仅返回完整保存并通过校验的用户文件路径。
 * 缓存记录独立于歌曲选择/音量设置；重装、清理或文件损坏后自动重新下载。
 */
class BgmCache {
  constructor(wxApi) {
    this.wxApi = wxApi;
    this.storage = new Storage(wxApi);
    this.pending = Object.create(null);
    this.fs = null;
    this.directory = wxApi.env && wxApi.env.USER_DATA_PATH
      ? `${wxApi.env.USER_DATA_PATH}/${CACHE_FOLDER}` : '';
    try {
      if (typeof wxApi.getFileSystemManager === 'function') {
        this.fs = wxApi.getFileSystemManager();
      }
    } catch (_) {
      // 不支持文件系统时静默停用 BGM，不会影响游戏。
    }
  }

  key(track) {
    // 路径仅由内置歌曲的安全 ID 构成，不使用歌曲显示名或网络输入。
    if (!track || !/^[a-z0-9_-]+$/i.test(track.id)) throw new Error('不合法的歌曲 ID');
    return track.id;
  }

  path(track) {
    return `${this.directory}/${this.key(track)}.mp3`;
  }

  metaKey(track) {
    return META_PREFIX + this.key(track);
  }

  version(track) {
    return track.version || 'v1';
  }

  ensureDirectory() {
    if (!this.fs || !this.directory) throw new Error('微信持久文件系统不可用');
    try {
      this.fs.mkdirSync(this.directory, true);
    } catch (error) {
      // 已存在目录在部分微信基础库里仍可能抛出 EEXIST。
      try {
        const stat = this.fs.statSync(this.directory, false);
        if (stat && stat.isDirectory()) return;
      } catch (_) {}
      throw error;
    }
  }

  removeFile(path) {
    try { this.fs.unlinkSync(path); } catch (_) {}
  }

  /** stat 为基础校验；支持 getFileInfo 时再计算 MD5，识别同大小的损坏文件。 */
  async fileInfo(path) {
    const stats = this.fs.statSync(path, false);
    if (!stats || !stats.isFile() || !Number.isFinite(stats.size)) {
      throw new Error('MP3 文件不存在或不是普通文件');
    }
    const info = { size: stats.size, digest: '' };
    if (typeof this.fs.getFileInfo === 'function') {
      try {
        const result = await new Promise((resolve, reject) => {
          this.fs.getFileInfo({ filePath: path, digestAlgorithm: 'md5', success: resolve, fail: reject });
        });
        if (result && typeof result.digest === 'string') info.digest = result.digest.toLowerCase();
      } catch (_) {
        // 少数基础库的文件摘要接口不可用，仍可做大小校验及播放错误修复。
      }
    }
    return info;
  }

  validSize(size) {
    return Number.isInteger(size) && size >= MIN_AUDIO_BYTES && size <= MAX_AUDIO_BYTES;
  }

  async existingPath(track) {
    const meta = this.storage.get(this.metaKey(track), null);
    if (!meta || meta.version !== this.version(track) || meta.src !== track.src || !this.validSize(meta.size)) {
      return null;
    }
    try {
      const info = await this.fileInfo(this.path(track));
      if (info.size !== meta.size) return null;
      if (meta.digest && info.digest && meta.digest !== info.digest) return null;
      return this.path(track);
    } catch (_) {
      return null;
    }
  }

  download(track) {
    return new Promise((resolve, reject) => {
      if (typeof this.wxApi.downloadFile !== 'function') {
        reject(new Error('wx.downloadFile 不可用'));
        return;
      }
      try {
        this.wxApi.downloadFile({
          url: track.src,
          timeout: 30000,
          success: (result) => {
            if (!result || result.statusCode !== 200 || !result.tempFilePath) {
              if (result && result.tempFilePath && this.fs) this.removeFile(result.tempFilePath);
              reject(new Error(`R2 下载失败 (HTTP ${result && result.statusCode})`));
              return;
            }
            resolve(result.tempFilePath);
          },
          fail: reject
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  saveFile(temp, destination) {
    return new Promise((resolve, reject) => {
      try {
        this.fs.saveFile({
          tempFilePath: temp,
          filePath: destination,
          success: (result) => resolve((result && result.savedFilePath) || destination),
          fail: reject
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async load(track) {
    this.ensureDirectory();
    const hit = await this.existingPath(track);
    if (hit) return hit;

    // 缺失、旧版本或损坏：先清理再重新下载，防止保存到旧路径时冲突。
    this.invalidate(track);
    const path = this.path(track);
    let temp = null;
    try {
      temp = await this.download(track);
      const downloaded = await this.fileInfo(temp);
      if (!this.validSize(downloaded.size)) throw new Error('MP3 下载不完整或大小异常');
      await this.saveFile(temp, path);
      const stored = await this.fileInfo(path);
      if (stored.size !== downloaded.size ||
          (downloaded.digest && stored.digest && downloaded.digest !== stored.digest)) {
        throw new Error('MP3 保存后校验失败');
      }
      this.storage.set(this.metaKey(track), {
        version: this.version(track), src: track.src,
        size: stored.size, digest: stored.digest || downloaded.digest || ''
      });
      return path;
    } catch (error) {
      // 下载或保存失败时不留下被误认为有效的文件。
      this.storage.set(this.metaKey(track), null);
      this.removeFile(path);
      throw error;
    } finally {
      if (temp) this.removeFile(temp); // saveFile 成功后临时文件已被移动，删除失败可忽略。
    }
  }

  get(track) {
    let key;
    try { key = this.key(track); } catch (error) { return Promise.reject(error); }
    if (this.pending[key]) return this.pending[key];
    const task = this.load(track);
    this.pending[key] = task;
    task.then(
      () => { if (this.pending[key] === task) delete this.pending[key]; },
      () => { if (this.pending[key] === task) delete this.pending[key]; }
    );
    return task;
  }

  invalidate(track) {
    this.storage.set(this.metaKey(track), null);
    if (this.fs && this.directory) this.removeFile(this.path(track));
  }
}

module.exports = BgmCache;
