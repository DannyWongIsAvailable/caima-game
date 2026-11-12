const CONFIG = require('../config/game-config');
const theme = require('../theme/tokens');
const UI = require('./ui-components');
const { roundedRect } = require('./draw-utils');

const C = theme.colors;
const F = theme.typography;
const DIALOG = { x: 20, y: 105, width: 335, height: 520 };
const TEXT_SIZE = 15;
const TEXT_X = 44;
const TEXT_Y = 193;
const LINE_HEIGHT = 22;
const LINES_PER_PAGE = 16;

/** 按 Canvas 实际字宽拆行；显式换行保留，适用于规则和逐码记录。 */
function wrapText(ctx, content, maxWidth) {
  const lines = [];
  String(content).split(/\r?\n/).forEach((paragraph) => {
    if (!paragraph) {
      lines.push('');
      return;
    }
    let line = '';
    Array.from(paragraph).forEach((char) => {
      if (line && ctx.measureText(line + char).width > maxWidth) {
        lines.push(line);
        line = char;
      } else {
        line += char;
      }
    });
    lines.push(line);
  });
  return lines;
}

/** 尽量将每段（例如单次出码记录）完整显示在同一页。 */
function paginate(ctx, content, maxWidth) {
  const pages = [[]];
  const paragraphs = String(content || '').split(/\r?\n\r?\n/);
  let current = pages[0];
  const nextPage = () => {
    current = [];
    pages.push(current);
  };
  const append = (line) => {
    if (current.length >= LINES_PER_PAGE) nextPage();
    current.push(line);
  };
  paragraphs.forEach((paragraph, index) => {
    const lines = wrapText(ctx, paragraph, maxWidth);
    if (index > 0 && current.length) {
      // 这段能放进单页却放不进当前页时，直接从新页开始，避免拆开出码记录。
      if (lines.length <= LINES_PER_PAGE && current.length + 1 + lines.length > LINES_PER_PAGE) {
        nextPage();
      } else {
        append('');
      }
    }
    lines.forEach(append);
  });
  return pages;
}

function drawButton(ctx, label, x, y, width, height, action, addHitArea) {
  roundedRect(ctx, x, y, width, height, 10, action ? C.accent : C.disabledSurface);
  UI.label(ctx, label, x + width / 2, y + height / 2, {
    size: 16, bold: true, color: action ? C.accentText : C.disabledText, align: 'center'
  });
  if (action) addHitArea(x, y, width, height, { type: action });
}

/** 通用文字弹窗：标题/内容可替换，自动分页，统一提供关闭与翻页点击区。 */
function drawPagedDialog(ctx, options, addHitArea) {
  const { title, content, requestedPage } = options;
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.70)';
  ctx.fillRect(0, 0, CONFIG.DESIGN_WIDTH, CONFIG.DESIGN_HEIGHT);
  roundedRect(ctx, DIALOG.x, DIALOG.y, DIALOG.width, DIALOG.height, 20, C.surface, C.border);
  UI.label(ctx, title, 187.5, 145, {
    size: 25, bold: true, color: C.primaryText, align: 'center'
  });
  ctx.fillStyle = C.divider;
  ctx.fillRect(42, 175, 291, 1);

  ctx.font = TEXT_SIZE + 'px ' + F.family;
  const pages = paginate(ctx, content, DIALOG.width - 48);
  const page = Math.max(0, Math.min(pages.length - 1, requestedPage || 0));
  pages[page].forEach((line, index) => {
    UI.label(ctx, line, TEXT_X, TEXT_Y + index * LINE_HEIGHT, {
      size: TEXT_SIZE, color: C.primaryText
    });
  });

  // 仅通过右上角 × 关闭；背景不响应事件。
  const closeX = 309;
  const closeY = 120;
  ctx.beginPath();
  ctx.strokeStyle = C.secondaryText;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.moveTo(closeX + 7, closeY + 7);
  ctx.lineTo(closeX + 21, closeY + 21);
  ctx.moveTo(closeX + 21, closeY + 7);
  ctx.lineTo(closeX + 7, closeY + 21);
  ctx.stroke();
  addHitArea(closeX - 4, closeY - 4, 36, 36, { type: 'CLOSE_DIALOG' });

  if (pages.length > 1) {
    UI.label(ctx, (page + 1) + ' / ' + pages.length, 187.5, 553, {
      size: F.note, color: C.secondaryText, align: 'center'
    });
    drawButton(ctx, '上一页', 43, 571, 86, 40, page > 0 ? 'DIALOG_PREV' : null, addHitArea);
    drawButton(ctx, '下一页', 246, 571, 86, 40,
        page < pages.length - 1 ? 'DIALOG_NEXT' : null, addHitArea);
  }
  ctx.restore();
}

module.exports = drawPagedDialog;
