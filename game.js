/**
 * 微信小游戏入口：原生 JavaScript + Canvas 2D，无需 WXML / Cocos。
 * 微信开发者工具会自动执行此文件。
 */
const MiniGameApp = require('./src/app');

const app = new MiniGameApp(wx);
app.mount();
