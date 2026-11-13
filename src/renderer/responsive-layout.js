const CONFIG = require('../config/game-config');
const theme = require('../theme/tokens');

/**
 * 以 375 为内容宽度、以安全区域为可用高度计算每个场景的位置。
 * 只有布局层决定坐标；Canvas 绘制与触摸热区共享同一份结果。
 * 不修改 theme/tokens 的设计基准，方便皮肤及已有代码继续复用。
 */
function createResponsiveLayout(viewport) {
  const width = CONFIG.DESIGN_WIDTH;
  const height = Number.isFinite(viewport.designHeight) && viewport.designHeight > 0
    ? viewport.designHeight : CONFIG.DESIGN_HEIGHT;
  const delta = height - CONFIG.DESIGN_HEIGHT;
  const midX = width / 2;
  const moveY = (rect, shift) => Object.assign({}, rect, { y: rect.y + shift });

  const homeBase = theme.homeLayout;
  const heroShift = delta * 0.45;
  const home = {
    title: Object.assign({}, homeBase.title, { y: homeBase.title.y + heroShift }),
    character: moveY(homeBase.character, heroShift),
    bubble: moveY(homeBase.bubble, heroShift),
    start: moveY(homeBase.start, heroShift),
    rules: Object.assign({}, homeBase.rules),
    settings: Object.assign({}, homeBase.settings, {
      y: height - (CONFIG.DESIGN_HEIGHT - homeBase.settings.y)
    })
  };

  const settingsBase = theme.settingsLayout;
  const settingsShift = delta * (delta < 0 ? 0.55 : 0.35);
  const settings = Object.assign({}, settingsBase, {
    titleY: settingsBase.titleY + settingsShift,
    subtitleY: settingsBase.subtitleY + settingsShift,
    skin: moveY(settingsBase.skin, settingsShift),
    bgm: moveY(settingsBase.bgm, settingsShift),
    music: moveY(settingsBase.music, settingsShift),
    effects: moveY(settingsBase.effects, settingsShift)
  });

  const bgmBase = theme.bgmLayout;
  const bgmShift = delta * (delta < 0 ? 0.30 : 0.34);
  const bgm = Object.assign({}, bgmBase, {
    titleY: bgmBase.titleY + bgmShift,
    subtitleY: bgmBase.subtitleY + bgmShift,
    y: bgmBase.y + bgmShift,
    footerY: bgmBase.y + bgmShift + 5 * bgmBase.rowHeight +
      4 * bgmBase.rowGap + bgmBase.footerGap
  });

  const skinBase = theme.skinLayout;
  const rowHeight = Math.max(74, Math.min(84, skinBase.rowHeight + Math.min(0, delta) * 0.10));
  const rowGap = Math.max(5, skinBase.rowGap + Math.min(0, delta) * 0.02);
  const skinY = skinBase.y + delta * (delta < 0 ? 0.30 : 0.34);
  const skins = Object.assign({}, skinBase, {
    y: skinY,
    rowHeight,
    rowGap,
    previewHeight: Math.min(skinBase.previewHeight, rowHeight - 10),
    footerY: skinY + 6 * rowHeight + 5 * rowGap + 29
  });

  const base = theme.gameLayout;
  const centerShift = delta / 2;
  // 短屏压缩手势高度而非拉伸 PNG；长屏留出更多手势与操作区的间距。
  const handHeight = Math.max(235, base.hand.height - Math.max(0, -delta) * 0.70);
  const handWidth = base.hand.width * handHeight / base.hand.height;
  const handOverhang = 30 * handHeight / base.hand.height;
  const handX = (width - handWidth) / 2;
  const game = {
    hand: {
      x: handX, y: -handOverhang, width: handWidth, height: handHeight,
      enterY: Math.max(height * 0.42, handHeight + 35)
    },
    playerHand: {
      x: handX, bottomY: height + handOverhang, width: handWidth, height: handHeight,
      enterY: Math.max(height * 0.42, handHeight + 35)
    },
    call: Object.assign({}, base.call, {
      x: midX, labelY: base.call.labelY + centerShift,
      numberY: base.call.numberY + centerShift
    }),
    scoreY: base.scoreY + centerShift,
    detailY: base.detailY + centerShift,
    outcomeY: base.outcomeY + centerShift,
    picking: {
      fist: Object.assign({}, base.picking.fist, {
        y: base.picking.fist.y + centerShift,
        labelY: base.picking.fist.labelY + centerShift
      }),
      call: Object.assign({}, base.picking.call, {
        y: base.picking.call.y + centerShift,
        labelY: base.picking.call.labelY + centerShift
      })
    },
    history: Object.assign({}, base.history),
    restart: moveY(base.restart, centerShift)
  };
  // 记录按钮以喊码区的真实底边为锚点，而不是独立的魔法数字。
  game.history.y = game.picking.call.y + 5 * game.picking.call.height +
    4 * game.picking.call.rowGap + 30;
  game.history.labelY = game.history.y + 60;

  const dialogY = Math.max(24, (height - 520) / 2 + 5);
  const dialog = {
    x: 20, y: dialogY, width: 335, height: 520,
    // 安全区内整块内容层都要被遮罩，宽屏居中的左右边也一并覆盖。
    scrimX: -(viewport.contentInsetX || 0),
    scrimWidth: viewport.designWidthFull || width,
    scrimHeight: height
  };

  return {
    width, height, home, settings, bgm, skins, game, dialog,
    icons: theme.iconLayout
  };
}

module.exports = createResponsiveLayout;
