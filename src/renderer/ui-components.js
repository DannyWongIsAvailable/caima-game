const theme = require('../theme/tokens');
const { roundedRect, text } = require('./draw-utils');

/** 统一绘制常用 UI 组件，避免不同页面按钮/卡片样式偏移。 */
function panel(ctx, x, y, width, height, options) {
  const o = options || {};
  roundedRect(
    ctx, x, y, width, height,
    o.radius == null ? theme.radii.panel : o.radius,
    o.fill || theme.colors.surface,
    o.noBorder ? undefined : theme.colors.border
  );
}

function label(ctx, value, x, y, options) {
  const o = options || {};
  text(ctx, value, x, y, {
    size: o.size || theme.typography.body,
    color: o.color || theme.colors.primaryText,
    align: o.align || 'left',
    bold: !!o.bold,
    maxWidth: o.maxWidth
  });
}

/** 仅影响绘制变换，不缩小实际热区。所有按钮、卡片、图标共用。 */
function withPress(ctx, x, y, width, height, progress, kind, draw) {
  const p = Math.max(0, Math.min(1, progress || 0));
  if (!p) return draw();
  const factor = kind === 'icon' ? 0.07 : kind === 'card' ? 0.018 : 0.05;
  const scale = 1 - factor * p;
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.scale(scale, scale);
  ctx.translate(-(x + width / 2), -(y + height / 2));
  ctx.globalAlpha *= 1 - 0.07 * p;
  draw();
  ctx.restore();
}

function pressTint(ctx, x, y, width, height, radius, progress) {
  if (progress > 0) {
    roundedRect(ctx, x, y, width, height, radius,
      'rgba(0, 0, 0, ' + (0.18 * progress).toFixed(3) + ')');
  }
}

function button(ctx, value, x, y, width, height, options) {
  const o = options || {};
  const disabled = !!o.disabled;
  const selected = !!o.selected;
  const primary = !!o.primary;
  const progress = disabled ? 0 : (o.pressProgress || 0);
  const bg = selected ? theme.colors.accent
    : disabled ? theme.colors.disabledSurface
    : primary ? theme.colors.accent : (theme.colors.buttonSurface || theme.colors.surfaceRaised);
  const foreground = selected ? theme.colors.accentText
    : disabled ? theme.colors.disabledText
    : primary ? theme.colors.accentText : (theme.colors.buttonText || theme.colors.primaryText);
  const radius = primary ? theme.radii.button : theme.radii.control;
  withPress(ctx, x, y, width, height, progress, 'button', () => {
    roundedRect(ctx, x, y, width, height, radius,
      bg, selected || primary ? undefined : theme.colors.border);
    pressTint(ctx, x, y, width, height, radius, progress);
    label(ctx, value, x + width / 2, y + height / 2 + 1, {
      size: primary ? theme.typography.button : theme.typography.number,
      align: 'center', color: foreground, bold: true
    });
  });
}

/** 图标按钮：PNG 绘制矩形即默认按钮边界。 */
function iconButton(ctx, name, image, x, y, width, height, options) {
  const progress = options && options.pressProgress || 0;
  withPress(ctx, x, y, width, height, progress, 'icon', () => {
    if (image) {
      ctx.drawImage(image, x, y, width, height);
      return;
    }
    // 仅在资源尚未加载时绘制文字占位。
    const fallback = { rules: '?', settings: '⚙', back: '←', home: '⌂' }[name] || '•';
    label(ctx, fallback, x + width / 2, y + height / 2, {
      size: Math.round(Math.min(width, height) * 0.65),
      bold: true,
      color: theme.colors.buttonText || theme.colors.primaryText,
      align: 'center'
    });
  });
}

function infoBar(ctx, value, x, y, width, height) {
  roundedRect(ctx, x, y, width, height, theme.radii.button, theme.colors.notice);
  label(ctx, value, x + width / 2, y + height / 2, {
    color: theme.colors.secondaryText,
    size: theme.typography.body,
    align: 'center',
    maxWidth: width - 16
  });
}

module.exports = { panel, label, button, iconButton, infoBar, withPress, pressTint };
