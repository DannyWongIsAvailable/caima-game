const CONFIG = require('../config/game-config');
const { generateAiAction, judgeRound, validatePlayer } = require('./rules');

/** 唯一数据源：页面、两段选择、结果、得分，不依赖 Canvas 和微信 API。 */
class GameModel {
  constructor(randomFn) {
    this.randomFn = randomFn || Math.random;
    this.reset();
  }

  reset() {
    this.phase = 'home'; // home -> picking -> result -> picking / over
    this.score = { player: 0, ai: 0 };
    this.roundNumber = 1;
    // 使用 null 表示尚未主动选择。避免上一轮数值让这一轮误触直接出码。
    this.player = { fist: null, call: null };
    this.lastResult = null;
    // 只记录本局已结算的出码，不写入微信本地存储；新开一局时 reset() 清空。
    this.history = [];
    this.champion = null;
  }

  start() {
    this.reset();
    this.phase = 'picking';
  }

  selectFist(value) {
    if (this.phase !== 'picking') return false;
    if (!Number.isInteger(value) || value < CONFIG.PLAYER_FIST_MIN || value > CONFIG.PLAYER_FIST_MAX) {
      return false;
    }
    this.player = { fist: value, call: null };
    return true;
  }

  selectCall(value) {
    if (this.phase !== 'picking' || this.player.fist === null) return false;
    const next = { fist: this.player.fist, call: value };
    try {
      validatePlayer(next);
    } catch (_) {
      return false;
    }
    this.player = next;
    return true;
  }

  /** 仅当本轮玩家主动选了出拳和喊码时，才允许结算。 */
  submit() {
    if (this.phase !== 'picking' || this.player.fist === null || this.player.call === null) return null;
    const ai = generateAiAction(this.randomFn);
    const result = judgeRound(this.player, ai);
    this.lastResult = result;
    this.history.push({
      roundNumber: this.roundNumber,
      player: { fist: result.player.fist, call: result.player.call },
      ai: { fist: result.ai.fist, call: result.ai.call },
      total: result.total,
      outcome: result.outcome,
      playerHit: result.playerHit,
      aiHit: result.aiHit
    });

    if (result.outcome === 'player') this.score.player += 1;
    if (result.outcome === 'ai') this.score.ai += 1;

    if (this.score.player >= CONFIG.TARGET_SCORE) this.champion = 'player';
    if (this.score.ai >= CONFIG.TARGET_SCORE) this.champion = 'ai';
    this.phase = this.champion ? 'over' : 'result';
    return result;
  }

  nextRound() {
    if (this.phase !== 'result') return false;
    this.roundNumber += 1;
    // 保留上一轮电脑出拳、喊码，直到本轮提交时才用新的结果替换。
    // 仍清空玩家选择，要求每轮重新选拳和喊码。
    this.player = { fist: null, call: null };
    this.phase = 'picking';
    return true;
  }
}

module.exports = GameModel;
