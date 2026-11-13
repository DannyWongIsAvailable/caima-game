/** R2 公开音频地址，仅保存 URL，不将 MP3 打包进小游戏。 */
const BASE_URL = 'https://pub-825995972777435eb40edb008fa57867.r2.dev/bgm/';

const SONGS = [
  { id: 'mingxiu', name: '明秀小学爱情故事' },
  { id: 'pixiu', name: '死性不改之劈酒猜码歌' },
  { id: 'shanhuhai', name: '珊瑚海之顶大学生个肺' },
  { id: 'motuo', name: '第一次骑摩托' }
];

const PLAYLIST = SONGS.map((song) => ({
  id: song.id,
  version: 'v1', // R2 替换歌曲内容时升级版本，旧缓存会自动失效。
  name: song.name,
  src: BASE_URL + encodeURIComponent(song.name + '.mp3')
}));

module.exports = PLAYLIST;
