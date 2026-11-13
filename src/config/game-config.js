/** 所有可调玩法参数集中在这里。 */
module.exports = {
  TITLE: '猜码',
  TARGET_SCORE: 3,
  PLAYER_FIST_MIN: 0,
  PLAYER_FIST_MAX: 5,
  PLAYER_CALL_MIN: 0,
  PLAYER_CALL_MAX: 10,
  // 猜码传统规则：可以出五指，但双方都不能喊“5”。
  FORBIDDEN_CALL: 5,
  AI_FIST_MIN: 0,
  AI_FIST_MAX: 5,
  AI_EXTRA_CALL_MAX: 5,
  // 首页「玩法说明」弹窗文字：直接修改下面的每一段即可，自动换行；内容较长时可翻页。
  RULES_TEXT: [
    '每轮先选出拳(0～5)，再选喊码(0～10，但不能喊5)；选完喊码立即开码。',
    '电脑随机出拳(0～5)，喊码在自己出拳到出拳加5之间，同样不能喊5。',
    '双方出拳数字相加，就是本轮总数；喊中总数才算猜中。',
    '只有一方猜中，该方得1分；双方都中或都未中时不计分。',
    '每轮结束后自动进入下一码；先得3分的一方赢得整局。'
  ].join('\n\n'),
  REVEAL_MS: 360,
  HOME_INTRO_MS: 1800,
  // 亮码动画完成后等待多久进入下一码；只清空玩家选择，保留电脑上轮展示。
  AUTO_NEXT_MS: 1300,
  // 设计坐标：渲染时等比缩放，触摸坐标会转换回来。
  DESIGN_WIDTH: 375,
  DESIGN_HEIGHT: 720
};
