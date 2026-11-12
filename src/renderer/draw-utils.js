const theme = require('../theme/tokens');

function roundedRect(ctx, x, y, width, height, radius, fill, stroke) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function text(ctx, value, x, y, options) {
  const o = options || {};
  ctx.fillStyle = o.color || theme.colors.primaryText;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = 'middle';
  ctx.font = (o.bold ? 'bold ' : '') + (o.size || theme.typography.body) + 'px ' + theme.typography.family;
  if (typeof o.maxWidth === 'number') {
    ctx.fillText(String(value), x, y, o.maxWidth);
  } else {
    ctx.fillText(String(value), x, y);
  }
}

function drawImageCover(ctx, img, x, y, width, height) {
  const iw = img.width || 1;
  const ih = img.height || 1;
  const scale = Math.max(width / iw, height / ih);
  const sw = width / scale;
  const sh = height / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
}

module.exports = { roundedRect, text, drawImageCover };
