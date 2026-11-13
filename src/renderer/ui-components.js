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

function button(ctx, value, x, y, width, height, options) {
  const o = options || {};
  const disabled = !!o.disabled;
  const selected = !!o.selected;
  const primary = !!o.primary;
  const bg = selected ? theme.colors.accent
    : disabled ? theme.colors.disabledSurface
    : primary ? theme.colors.accent : (theme.colors.buttonSurface || theme.colors.surfaceRaised);
  const foreground = selected ? theme.colors.accentText
    : disabled ? theme.colors.disabledText
    : primary ? theme.colors.accentText : (theme.colors.buttonText || theme.colors.primaryText);
  roundedRect(ctx, x, y, width, height,
    primary ? theme.radii.button : theme.radii.control,
    bg, selected || primary ? undefined : theme.colors.border);
  label(ctx, value, x + width / 2, y + height / 2 + 1, {
    size: primary ? theme.typography.button : theme.typography.number,
    align: 'center', color: foreground, bold: true
  });
}

/** 图标按钮：PNG 的绘制矩形即按钮边界，不添加底板、描边或额外留白。 */
function iconButton(ctx, name, image, x, y, width, height) {
  if (image) {
    ctx.drawImage(image, x, y, width, height);
    return;
  }
  // 仅在资源尚未加载时绘制文字占位；同样不添加额外按钮框。
  const fallback = { rules: '?', settings: '⚙', back: '←', home: '⌂' }[name] || '•';
  label(ctx, fallback, x + width / 2, y + height / 2, {
    size: Math.round(Math.min(width, height) * 0.65),
    bold: true,
    color: theme.colors.buttonText || theme.colors.primaryText,
    align: 'center'
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

module.exports = { panel, label, button, iconButton, infoBar };
