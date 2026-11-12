const theme = require('../theme/tokens');
const CONFIG = require('../config/game-config');
const { drawImageCover, roundedRect } = require('./draw-utils');
const { SKINS } = require('../theme/skins');
const UI = require('./ui-components');
const { drawHand } = require('./ai-hand');

const C = theme.colors;
const F = theme.typography;
const L = theme.gameLayout;

/**
 * 只负责绘制和点击区域，不参与游戏判定/自动推进。
 * 样式：src/theme/tokens.js；组件：src/renderer/ui-components.js。
 */
class CanvasRenderer {
  constructor(canvas, viewport, images) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) throw new Error('无法获取 Canvas 2D 绘图上下文');
    this.viewport = viewport;
    this.images = images;
    this.hitAreas = [];
  }

  render(model, revealProgress, isAnimating, previousAiFist, viewPage, skinId, homeIntro, rulesPage) {
    this.hitAreas = [];
    const ctx = this.ctx;
    ctx.save();
    this.viewport.useFullScreen(ctx);
    this.drawScreenBackground(ctx, this.viewport.width, this.viewport.height, skinId);
    ctx.save();
    this.viewport.useDesignSpace(ctx);
    if (model.phase === 'home') {
      if (viewPage === 'skins') this.drawSkins(ctx, skinId);
      else if (viewPage === 'settings') this.drawSettings(ctx);
      else {
        this.drawHome(ctx, homeIntro);
        if (viewPage === 'rules') {
          // 弹窗独占触摸，禁止穿透到底下的开始游戏、玩法和设置按钮。
          this.hitAreas = [];
          this.drawRulesDialog(ctx, rulesPage);
        }
      }
    } else this.drawGame(ctx, model, revealProgress, isAnimating, previousAiFist);
    ctx.restore();
    ctx.restore();
  }

  drawScreenBackground(ctx, width, height, skinId) {
    const image = this.images.getSkinBackground(skinId);
    if (image) {
      drawImageCover(ctx, image, 0, 0, width, height);
      ctx.fillStyle = C.backdrop;
      ctx.fillRect(0, 0, width, height);
      // 控件集中在下半屏，局部加强对比度而不遮挡上方地标/山水。
      const shade = ctx.createLinearGradient(0, height * 0.44, 0, height);
      shade.addColorStop(0, 'rgba(0,0,0,0)');
      shade.addColorStop(1, C.bottomVeil);
      ctx.fillStyle = shade;
      ctx.fillRect(0, height * 0.44, width, height * 0.56);
      return;
    }
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, C.bgTop);
    gradient.addColorStop(1, C.bgBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 1;
    ctx.strokeStyle = C.backgroundPattern;
    for (let i = -height; i < width + height; i += 36) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height, height);
      ctx.stroke();
    }
  }

  /** 首页：标题渐入、人物侧滑探身、随后出现对话气泡。 */
  drawHome(ctx, intro) {
    const home = theme.homeLayout;
    const state = this.resolveHomeIntro(intro);

    const titleY = home.title.y - 14 * (1 - state.title);
    ctx.save();
    ctx.globalAlpha = state.title;
    UI.label(ctx, CONFIG.TITLE, home.title.x, titleY, {
      size: F.homeTitle, bold: true, color: C.homeTitleText || C.accent, align: 'center'
    });
    ctx.restore();

    this.drawHomeCharacter(ctx, state.character);
    if (state.bubble > 0) this.drawHomeBubble(ctx, state.bubble);

    const start = home.start;
    this.drawActionButton(ctx, '开始游戏', start.x, start.y, start.width, start.height,
        { type: 'START' });
    const rules = home.rules;
    this.drawIconButton(ctx, 'rules', rules.x, rules.y, rules.width,
        rules.height, { type: 'OPEN_RULES' });
    const settings = home.settings;
    this.drawIconButton(ctx, 'settings', settings.x, settings.y, settings.width,
        settings.height, { type: 'OPEN_SETTINGS' });
  }

  /** 首页玩法弹窗：规则文案取自 game-config.js，自动换行并在过长时分页。 */
  drawRulesDialog(ctx, requestedPage) {
    const dialog = { x: 20, y: 105, width: 335, height: 520 };
    const textX = 44;
    const textY = 193;
    const lineHeight = 22;
    const linesPerPage = 16;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.70)';
    ctx.fillRect(0, 0, CONFIG.DESIGN_WIDTH, CONFIG.DESIGN_HEIGHT);
    roundedRect(ctx, dialog.x, dialog.y, dialog.width, dialog.height, 20,
        C.surface, C.border);
    UI.label(ctx, '玩法说明', 187.5, 145, {
      size: 25, bold: true, color: C.primaryText, align: 'center'
    });
    ctx.fillStyle = C.divider;
    ctx.fillRect(42, 175, 291, 1);

    // 与显示的字号保持一致，按真实 Canvas 字宽对中英文混排进行换行。
    const fontSize = 15;
    ctx.font = fontSize + 'px ' + F.family;
    const lines = this.wrapRulesText(ctx, CONFIG.RULES_TEXT, dialog.width - 48);
    const pageCount = Math.max(1, Math.ceil(lines.length / linesPerPage));
    const page = Math.max(0, Math.min(pageCount - 1, requestedPage || 0));
    lines.slice(page * linesPerPage, (page + 1) * linesPerPage).forEach((line, index) => {
      UI.label(ctx, line, textX, textY + index * lineHeight, {
        size: fontSize, color: C.primaryText
      });
    });

    // 右上角 X 和底部关闭按钮始终可关闭；长内容额外展示翻页按钮。
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
    this.addHitArea(closeX - 4, closeY - 4, 36, 36, { type: 'CLOSE_RULES' });

    if (pageCount > 1) {
      UI.label(ctx, (page + 1) + ' / ' + pageCount, 187.5, 553, {
        size: F.note, color: C.secondaryText, align: 'center'
      });
      this.drawDialogButton(ctx, '上一页', 43, 571, 86, 40,
          page > 0 ? { type: 'RULES_PREV' } : null);
      this.drawDialogButton(ctx, '关闭', 144, 571, 87, 40, { type: 'CLOSE_RULES' });
      this.drawDialogButton(ctx, '下一页', 246, 571, 86, 40,
          page < pageCount - 1 ? { type: 'RULES_NEXT' } : null);
    } else {
      this.drawDialogButton(ctx, '知道了', 122, 571, 131, 40, { type: 'CLOSE_RULES' });
    }
  }

  wrapRulesText(ctx, content, maxWidth) {
    const lines = [];
    String(content || '').split(/\r?\n/).forEach((paragraph, index) => {
      if (index > 0 && paragraph === '') {
        lines.push('');
        return;
      }
      let line = '';
      Array.from(paragraph).forEach((char) => {
        const candidate = line + char;
        if (line && ctx.measureText(candidate).width > maxWidth) {
          lines.push(line);
          line = char;
        } else {
          line = candidate;
        }
      });
      lines.push(line);
    });
    return lines;
  }

  drawDialogButton(ctx, label, x, y, width, height, action) {
    roundedRect(ctx, x, y, width, height, 10,
        action ? C.accent : C.disabledSurface);
    UI.label(ctx, label, x + width / 2, y + height / 2, {
      size: 16, bold: true,
      color: action ? C.accentText : C.disabledText, align: 'center'
    });
    if (action) this.addHitArea(x, y, width, height, action);
  }

  /** 设置页面仅保留「更换皮肤」主入口和返回导航。 */
  drawSettings(ctx) {
    const back = theme.iconLayout.back;
    this.drawIconButton(ctx, 'back', back.x, back.y, back.width, back.height,
        { type: 'CLOSE_SETTINGS' }, true);
    const button = theme.homeLayout.skinEntry;
    this.drawActionButton(ctx, '更换皮肤', button.x, button.y,
        button.width, button.height, { type: 'OPEN_SKINS' });
  }

  /** 皮肤选择页：只更换视觉资源，不影响比分和出码规则。 */
  drawSkins(ctx, activeId) {
    const back = theme.iconLayout.back;
    this.drawIconButton(ctx, 'back', back.x, back.y, back.width, back.height,
        { type: 'CLOSE_SKINS' }, true);
    UI.label(ctx, '选择皮肤', 187.5, 66, {
      size: 28, color: C.primaryText, bold: true, align: 'center'
    });
    UI.label(ctx, '选择后即刻生效，重新进入也会保留', 187.5, 101, {
      size: F.detail, color: C.secondaryText, align: 'center'
    });

    const S = theme.skinLayout;
    SKINS.forEach((skin, index) => {
      const x = S.x;
      const y = S.y + index * (S.rowHeight + S.rowGap);
      const selected = skin.id === activeId;
      roundedRect(ctx, x, y, S.width, S.rowHeight, 14,
          selected ? C.surfaceRaised : C.surface,
          selected ? C.accent : C.border);
      const thumbnail = this.images.get('skinPreview_' + skin.id);
      const py = y + (S.rowHeight - S.previewHeight) / 2;
      if (thumbnail) {
        ctx.drawImage(thumbnail, S.previewX, py, S.previewWidth, S.previewHeight);
      } else {
        roundedRect(ctx, S.previewX, py, S.previewWidth, S.previewHeight, 6, skin.swatches[0]);
      }
      UI.label(ctx, skin.name, S.textX, y + 23, {
        size: 18, bold: true, color: C.primaryText
      });
      UI.label(ctx, skin.subtitle, S.textX, y + 45, {
        size: F.note, color: C.secondaryText
      });
      skin.swatches.forEach((color, i) => {
        roundedRect(ctx, S.textX + i * 27, y + 62, 21, 10, 3, color);
      });
      UI.label(ctx, selected ? '✓ 当前' : '选择', 320, y + 23, {
        size: F.note,
        color: selected ? (C.selectedIndicator || C.accent) : C.secondaryText,
        bold: selected, align: 'right'
      });
      this.addHitArea(x, y, S.width, S.rowHeight,
          { type: 'SELECT_SKIN', id: skin.id });
    });
    UI.label(ctx, '背景与按钮、文字配色将一起切换', 187.5, S.footerY, {
      size: F.note, color: C.secondaryText, align: 'center'
    });
  }

  /** 三段顺序执行：标题淡入(0~30%) → 人物滑入(30~75%) → 气泡(75~100%)。 */
  resolveHomeIntro(intro) {
    const progress = intro && typeof intro.progress === 'number' ? intro.progress : 1;
    return {
      title: this.easeOut(this.segment(progress, 0, 0.30)),
      character: this.easeOut(this.segment(progress, 0.30, 0.75)),
      bubble: this.easeOut(this.segment(progress, 0.75, 1))
    };
  }

  segment(value, start, end) {
    if (value <= start) return 0;
    if (value >= end) return 1;
    return (value - start) / Math.max(0.0001, end - start);
  }

  easeOut(value) {
    const t = Math.max(0, Math.min(1, value));
    return 1 - Math.pow(1 - t, 3);
  }

  drawHomeCharacter(ctx, progress) {
    const image = this.images.get('homeMan');
    if (!image || progress <= 0) return;
    const layout = theme.homeLayout.character;
    // 使用实际图片尺寸：用户提供的 509×571 PNG 不被拉伸。
    const width = layout.width;
    const height = width * ((image.height || 571) / (image.width || 509));
    const x = layout.exitX + (layout.x - layout.exitX) * progress;
    const y = layout.y + (1 - progress) * 8;
    ctx.save();
    ctx.globalAlpha = 0.65 + progress * 0.35;
    ctx.drawImage(image, x, y, width, height);
    ctx.restore();
  }

  drawHomeBubble(ctx, progress) {
    if (progress <= 0) return;
    const layout = theme.homeLayout.bubble;
    const x = layout.x;
    const y = layout.y + (1 - progress) * 8;
    const width = layout.width;
    const height = layout.height;
    ctx.save();
    ctx.globalAlpha = progress;
    // 米白色气泡与所有六套皮肤保持足够对比度。
    roundedRect(ctx, x, y, width, height, 16,
        'rgba(255, 249, 235, 0.97)', 'rgba(57, 43, 27, 0.20)');
    ctx.beginPath();
    ctx.moveTo(x + width - 16, y + height - 11);
    ctx.lineTo(x + width + 21, y + height + 5);
    ctx.lineTo(x + width - 26, y + height - 2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 249, 235, 0.97)';
    ctx.fill();
    UI.label(ctx, '我来同你饮', x + width / 2, y + height / 2 + 1, {
      size: 17, bold: true, color: '#352A22', align: 'center'
    });
    ctx.restore();
  }

  drawIconButton(ctx, name, x, y, width, height, action, nav) {
    const key = { rules: 'iconRule', settings: 'iconSettings', back: 'iconBack', home: 'iconHome' }[name];
    UI.iconButton(ctx, name, this.images.get(key), x, y, width, height, { nav: !!nav });
    if (action) this.addHitArea(x, y, width, height, action);
  }

  drawGame(ctx, model, revealProgress, isAnimating, previousAiFist) {
    // 对战页是「大手势 + 旁边喊码 + 文字比分 + 无卡片数字操作区」。
    // 不绘制顶端标题、原中部步骤卡片、原底部提示卡片。
    const result = model.lastResult;
    // 选择阶段保留上一轮展示；选完喊码时新喊码立即更新，手势播放伸出动画。
    this.drawAiArea(ctx, result, {
      progress: isAnimating ? revealProgress : 1,
      isAnimating,
      previousFist: previousAiFist
    });
    this.drawGameText(ctx, model);
    if (model.phase === 'over') {
      const b = L.restart;
      this.drawActionButton(ctx, '再玩一局', b.x, b.y, b.width, b.height,
          isAnimating ? null : { type: 'START' });
    } else {
      this.drawPickingControls(ctx, model);
    }
    // 顶部独立入口：动画/结算期间也始终能返回首页。
    const home = theme.iconLayout.home;
    this.drawIconButton(ctx, 'home', home.x, home.y, home.width, home.height,
        { type: 'RETURN_HOME' }, true);
  }

  drawAiArea(ctx, result, animation) {
    drawHand(ctx, this.images, result ? result.ai.fist : null, animation);
    UI.label(ctx, '电脑喊码', L.call.x, L.call.labelY, {
      size: F.miniLabel, color: C.secondaryText, align: 'center'
    });
    // 首次进入时无结果，喊码区域保持空白；开码后立即显示新数字。
    if (result) {
      UI.label(ctx, result.ai.call, L.call.x, L.call.numberY, {
        size: F.aiCall, color: C.aiCallText || C.accent, bold: true, align: 'center'
      });
    }
  }

  drawGameText(ctx, model) {
    // 比分不再有背景卡片，始终只占一行小字。
    UI.label(ctx,
        '你 ' + model.score.player + '  :  ' + model.score.ai + '  电脑     ·     第 ' + model.roundNumber + ' 码',
        187.5, L.scoreY, {
          size: F.compactScore, color: C.secondaryText, align: 'center'
        });

    const result = model.lastResult;
    if (!result || model.phase === 'picking') {
      UI.label(ctx, '选出拳，再点喊码直接开码', 187.5, L.detailY, {
        size: F.note, color: C.secondaryText, align: 'center'
      });
      return;
    }
    UI.label(ctx,
        '合计 ' + result.total + ' · 你出 ' + result.player.fist + ' / 喊 ' + result.player.call,
        187.5, L.detailY, {
          size: F.note, color: C.primaryText, align: 'center'
        });

    let text = '未分胜负 · 自动下一码';
    let color = C.secondaryText;
    if (result.playerHit && result.aiHit) text = '双方同时猜中 · 不计分';
    else if (result.outcome === 'player') {
      text = '你猜中了！+1 分';
      color = C.success;
    } else if (result.outcome === 'ai') {
      text = '电脑猜中了！电脑 +1 分';
      color = C.danger;
    }
    if (model.phase === 'over') {
      text = model.champion === 'player' ? '你赢了！' : '电脑赢了！';
      color = model.champion === 'player' ? C.success : C.danger;
    }
    UI.label(ctx, text, 187.5, L.outcomeY, {
      size: F.detail, bold: true, color, align: 'center'
    });
  }

  drawPickingControls(ctx, model) {
    const p = L.picking;
    const picking = model.phase === 'picking';
    const fistSelected = model.player.fist !== null;
    const size = theme.control.pickSize;
    const stride = size + p.gap;

    // 纯标签+数字按钮，不再用大卡片包裹。
    UI.label(ctx, '你的出拳', p.labelX, p.fistLabelY, {
      size: F.miniLabel, color: C.secondaryText
    });
    for (let i = 0; i <= 5; i += 1) {
      this.drawPickButton(ctx, String(i), p.x + i * stride, p.fistButtonY,
          size, theme.control.fistHeight, model.player.fist === i,
          picking ? { type: 'FIST', value: i } : null, !picking);
    }

    UI.label(ctx, '你的喊码', p.labelX, p.callLabelY, {
      size: F.miniLabel, color: C.secondaryText
    });
    for (let n = 0; n <= 10; n += 1) {
      const x = p.x + (n % 6) * stride;
      const y = n < 6 ? p.callFirstY : p.callSecondY;
      const available = picking && fistSelected;
      this.drawPickButton(ctx, String(n), x, y, size, theme.control.callHeight,
          model.player.call === n,
          available ? { type: 'CALL', value: n } : null, !available);
    }
  }

  drawPickButton(ctx, value, x, y, width, height, selected, action, disabled) {
    UI.button(ctx, value, x, y, width, height, { selected, disabled });
    if (action) this.addHitArea(x, y, width, height, action);
  }

  drawActionButton(ctx, value, x, y, width, height, action) {
    UI.button(ctx, value, x, y, width, height, { primary: true, disabled: !action });
    if (action) this.addHitArea(x, y, width, height, action);
  }

  addHitArea(x, y, width, height, action) {
    this.hitAreas.push({ x, y, width, height, action });
  }

  hitTest(x, y) {
    for (let i = this.hitAreas.length - 1; i >= 0; i -= 1) {
      const area = this.hitAreas[i];
      if (x >= area.x && x <= area.x + area.width && y >= area.y && y <= area.y + area.height) {
        return area.action;
      }
    }
    return null;
  }
}

module.exports = CanvasRenderer;
