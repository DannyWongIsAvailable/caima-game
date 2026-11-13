const theme = require('../theme/tokens');
const manifest = require('../media/media-manifest');
const { roundedRect } = require('./draw-utils');
const UI = require('./ui-components');

const C = theme.colors;
const F = theme.typography;
const L = theme.gameLayout;

/**
 * 上下双手复用 hand-0～hand-5：原图手腕在上、手指向下。
 * 电脑保持原方向（顶部贴边），玩家旋转 180°（底部贴边）。
 * 所有素材等比缩放；动画仅平移，不改变边界锚点和手势比例。
 */
function drawHand(ctx, images, fist, animation) {
  drawAnimatedHand(ctx, images, fist, L.hand, false, animation);
  const opts = animation || {};
  const p = Math.max(0, Math.min(1, opts.progress == null ? 1 : opts.progress));
  if (opts.isAnimating && p > 0) drawOptionalRevealSprite(ctx, images, p);
}

function drawPlayerHand(ctx, images, fist, animation) {
  drawAnimatedHand(ctx, images, fist, L.playerHand, true, animation);
}

function drawAnimatedHand(ctx, images, fist, bounds, fromBottom, animation) {
  if (!Number.isInteger(fist)) return;
  const opts = animation || {};
  const p = Math.max(0, Math.min(1, opts.progress == null ? 1 : opts.progress));
  const direction = fromBottom ? 1 : -1;
  const alpha = opts.neutral ? 0.66 : 1;
  if (opts.isAnimating) {
    const oldFist = Number.isInteger(opts.previousFist) ? opts.previousFist : null;
    if (p < 1 && oldFist !== null) {
      // 旧手沿各自入场方向收回，再切换至新一轮手势。
      drawGesture(ctx, images, oldFist, bounds, fromBottom,
        direction * p * bounds.enterY, 1 - p);
    }
    // 电脑从上向下、玩家从下向上伸出，最后严格贴住边界。
    drawGesture(ctx, images, fist, bounds, fromBottom,
      direction * (1 - p) * bounds.enterY, alpha);
  } else {
    drawGesture(ctx, images, fist, bounds, fromBottom, 0, alpha);
  }
}

function drawGesture(ctx, images, fist, bounds, fromBottom, offsetY, alpha) {
  const image = images.get('hand' + fist);
  ctx.save();
  ctx.translate(0, offsetY);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  const scale = image
    ? Math.min(bounds.width / (image.width || 1), bounds.height / (image.height || 1))
    : 1;
  const width = image ? (image.width || 1) * scale : bounds.width;
  const height = image ? (image.height || 1) * scale : bounds.height;
  const x = bounds.x + (bounds.width - width) / 2;
  const y = fromBottom ? bounds.bottomY - height : bounds.y;
  if (image) {
    if (fromBottom) {
      ctx.save();
      ctx.translate(x + width, y + height);
      ctx.rotate(Math.PI);
      ctx.drawImage(image, 0, 0, width, height);
      ctx.restore();
    } else {
      ctx.drawImage(image, x, y, width, height);
    }
  } else {
    drawFallbackHand(ctx, fist, x, y, width, height, fromBottom);
  }
  ctx.restore();
}

function drawFallbackHand(ctx, fist, x, y, width, height, fromBottom) {
  const originalX = x;
  const originalY = y;
  ctx.save();
  if (fromBottom) {
    ctx.translate(x + width, y + height);
    ctx.rotate(Math.PI);
    x = 0;
    y = 0;
  }
  roundedRect(ctx, x + width * 0.35, y, width * 0.30, height * 0.58,
    20, C.handPlaceholder, C.handOutline);
  roundedRect(ctx, x + width * 0.18, y + height * 0.37, width * 0.64, height * 0.43,
    30, C.handPlaceholder, C.handOutline);
  ctx.restore();
  // 资源加载失败时数字保持正向可读（不随手部旋转）。
  UI.label(ctx, String(fist), originalX + width / 2,
    originalY + height * (fromBottom ? 0.34 : 0.65),
    { size: F.handFallback, bold: true, color: C.accent, align: 'center' });
}

function drawOptionalRevealSprite(ctx, images, progress) {
  const image = images.get('revealStrip');
  if (!image) return;
  const frames = Math.max(1, manifest.images.revealStrip.frames || 8);
  const width = image.width / frames;
  const frame = Math.min(frames - 1, Math.floor(progress * frames));
  ctx.save();
  ctx.globalAlpha = progress * 0.8;
  // 可选粒子特效放在中间上方，不覆盖两侧数字按钮。
  ctx.drawImage(image, frame * width, 0, width, image.height, 208, 260, 42, 42);
  ctx.restore();
}

module.exports = { drawHand, drawPlayerHand };
