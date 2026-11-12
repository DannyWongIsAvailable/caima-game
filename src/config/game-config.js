/** 所有可调玩法参数集中在这里。 */
module.exports = {
  TITLE: '广西猜码',
  TARGET_SCORE: 3,
  PLAYER_FIST_MIN: 0,
  PLAYER_FIST_MAX: 5,
  PLAYER_CALL_MIN: 0,
  PLAYER_CALL_MAX: 10,
  AI_FIST_MIN: 0,
  AI_FIST_MAX: 5,
  AI_EXTRA_CALL_MAX: 5,
  REVEAL_MS: 360,
  HOME_INTRO_MS: 1800,
  // 亮码动画完成后等待多久进入下一码；只清空玩家选择，保留电脑上轮展示。
  AUTO_NEXT_MS: 1300,
  // 设计坐标：渲染时等比缩放，触摸坐标会转换回来。
  DESIGN_WIDTH: 375,
  DESIGN_HEIGHT: 720
};
