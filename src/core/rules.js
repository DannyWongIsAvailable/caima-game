/**
 * 独立纯函数：无需微信 API，便于测试。
 * 玩家：出拳 0~5，喊码 0~10（排除 5），二者之间不设大小约束。
 * 人机：出拳 0~5，且 出拳 <= 喊码 <= 出拳 + 5，喊码排除 5。
 */
const CONFIG = require('../config/game-config');

function isIntegerInRange(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function validatePlayer(player) {
  if (!player || !isIntegerInRange(player.fist, CONFIG.PLAYER_FIST_MIN, CONFIG.PLAYER_FIST_MAX)) {
    throw new Error('玩家出拳必须为 0~5 的整数');
  }
  if (!isIntegerInRange(player.call, CONFIG.PLAYER_CALL_MIN, CONFIG.PLAYER_CALL_MAX) ||
      player.call === CONFIG.FORBIDDEN_CALL) {
    throw new Error('玩家喊码必须为 0~10 且不能为 5 的整数');
  }
  // 重要：不能附加 call >= fist 限制，玩家可以任意喊码。
}

function validateAi(ai) {
  if (!ai || !isIntegerInRange(ai.fist, CONFIG.AI_FIST_MIN, CONFIG.AI_FIST_MAX)) {
    throw new Error('人机出拳必须为 0~5 的整数');
  }
  if (!isIntegerInRange(ai.call, ai.fist, ai.fist + CONFIG.AI_EXTRA_CALL_MAX) ||
      ai.call === CONFIG.FORBIDDEN_CALL) {
    throw new Error('人机喊码必须在 [自己出拳, 自己出拳 + 5] 且不能为 5');
  }
}

/** 返回包含上下限的随机整数，可注入随机函数作确定性测试。 */
function randomInt(min, max, randomFn) {
  const rng = randomFn || Math.random;
  const x = rng();
  if (!(x >= 0 && x < 1)) throw new Error('随机函数应返回 [0,1) 内的数');
  return min + Math.floor(x * (max - min + 1));
}

/** AI 不读取玩家行动，不作弊。 */
function generateAiAction(randomFn) {
  const fist = randomInt(CONFIG.AI_FIST_MIN, CONFIG.AI_FIST_MAX, randomFn);
  // 只从合法喊码候选中等概率抽取，避免拒绝采样对固定随机函数死循环。
  const calls = [];
  for (let value = fist; value <= fist + CONFIG.AI_EXTRA_CALL_MAX; value += 1) {
    if (value !== CONFIG.FORBIDDEN_CALL) calls.push(value);
  }
  const call = calls[randomInt(0, calls.length - 1, randomFn)];
  return { fist, call };
}

function judgeRound(player, ai) {
  validatePlayer(player);
  validateAi(ai);

  const total = player.fist + ai.fist;
  const playerHit = player.call === total;
  const aiHit = ai.call === total;
  let outcome = 'draw';

  // 双方同时猜中或同时没中时都不记分。
  if (playerHit && !aiHit) outcome = 'player';
  if (!playerHit && aiHit) outcome = 'ai';

  return {
    player: { fist: player.fist, call: player.call },
    ai: { fist: ai.fist, call: ai.call },
    total,
    playerHit,
    aiHit,
    outcome
  };
}

module.exports = {
  validatePlayer,
  validateAi,
  generateAiAction,
  judgeRound,
  randomInt
};
