const theme = require('../theme/tokens');
const manifest = require('../media/media-manifest');
const { roundedRect } = require('./draw-utils');
const UI = require('./ui-components');

const C = theme.colors;
const F = theme.typography;
const L = theme.gameLayout;

/**
 * 电脑手势展示层：素材独立于页面布局与胜负规则。
 * 透明 PNG（256×341）约定为「手腕从画面顶部进入，手指朝下」，hand-0.png ～ hand-5.png
 * 分别对应出拳 0～5。素材未加载时使用原有占位，避免阻断对局。
 */
function drawHand(ctx, images, fist, animation) {
  const opts = animation || {};
  const p = Math.max(0, Math.min(1, opts.progress == null ? 1 : opts.progress));
  const animating = !!opts.isAnimating && Number.isInteger(fist);
  const enterY = L.hand.enterY;

  // 首次进入对局尚无电脑出拳结果，手势区域保持空白。
  // 有结果后仍保留缺图占位兜底和原有伸手动画。
  if (Number.isInteger(fist)) {
    if (animating) {
      // 旧手在新一轮选择时始终可见；真正出码时才逐渐向上收回。
      const oldFist = Number.isInteger(opts.previousFist) ? opts.previousFist : null;
      if (p < 1 && oldFist !== null) {
        drawGesture(ctx, images, oldFist, -p * enterY, 1 - p);
      }
      // 新结果已经提交，使用本轮手势，自顶部往下伸出。
      drawGesture(ctx, images, fist, -(1 - p) * enterY, 1);
    } else {
      // 非出码阶段固定停留在上一轮或本轮完成的姿势，不清空、不重复播放。
      drawGesture(ctx, images, fist, 0, 1);
    }
  }

  UI.label(ctx, '电脑出拳', L.handCaption.x, L.handCaption.y, {
    size: F.miniLabel, color: C.secondaryText, align: 'center'
  });
  if (animating && p > 0) drawOptionalRevealSprite(ctx, images, p);
}

function drawGesture(ctx, images, fist, offsetY, alpha) {
  const image = Number.isInteger(fist) ? images.get('hand' + fist) : null;
  ctx.save();
  ctx.translate(0, offsetY);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  if (image) drawTopAlignedImage(ctx, image, L.hand);
  else drawFallbackHand(ctx, fist);
  ctx.restore();
}

function drawTopAlignedImage(ctx, image, bounds) {
  const iw = image.width || 1;
  const ih = image.height || 1;
  // contain + 顶端对齐：不裁掉手指、不会将图片强制拉伸变形。
  const scale = Math.min(bounds.width / iw, bounds.height / ih);
  const width = iw * scale;
  const height = ih * scale;
  ctx.drawImage(image, bounds.x + (bounds.width - width) / 2, bounds.y, width, height);
}

function drawFallbackHand(ctx, fist) {
  const hand = L.hand;
  const cx = hand.x + hand.width / 2;
  // 占位形状只表明手势绘制区域，不模拟 0～5 根手指，避免误导。
  roundedRect(ctx, cx - 40, hand.y - 24, 80, 256, 26, C.handPlaceholder, C.handOutline);
  roundedRect(ctx, cx - 71, hand.y + 178, 142, 152, 48, C.handPlaceholder, C.handOutline);
  UI.label(ctx, fist === null ? '?' : String(fist), cx, hand.y + 255, {
    size: F.handFallback, bold: true, color: C.accent, align: 'center'
  });
}

function drawOptionalRevealSprite(ctx, images, progress) {
  const image = images.get('revealStrip');
  if (!image) return;
  const frames = Math.max(1, manifest.images.revealStrip.frames || 8);
  const width = image.width / frames;
  const frame = Math.min(frames - 1, Math.floor(progress * frames));
  ctx.save();
  ctx.globalAlpha = progress * 0.8;
  ctx.drawImage(image, frame * width, 0, width, image.height, 218, 267, 58, 58);
  ctx.restore();
}

module.exports = { drawHand };
