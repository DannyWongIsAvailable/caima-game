const theme = require('../theme/tokens');
const CONFIG = require('../config/game-config');
const { drawImageCover, roundedRect } = require('./draw-utils');
const { SKINS } = require('../theme/skins');
const UI = require('./ui-components');
const { drawHand, drawPlayerHand } = require('./ai-hand');
const drawPagedDialog = require('./paged-dialog');

const C = theme.colors;
const F = theme.typography;
const L = theme.gameLayout;

/**
 * 只负责绘制和点击区域，不参与游戏判定/自动推进。
 * 样式：src/theme/tokens.js；组件：src/renderer/ui-components.js。
 */
class CanvasRenderer {
  constructor(canvas, viewport, images, pressFeedback) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) throw new Error('无法获取 Canvas 2D 绘图上下文');
    this.viewport = viewport;
    this.images = images;
    this.pressFeedback = pressFeedback || null;
    this.scope = null;
    this.hitAreas = [];
  }

  render(model, revealProgress, isAnimating, previousAiFist, viewPage, skinId, homeIntro, dialog, soundSettings, playerHandAnimation) {
    this.hitAreas = [];
    // 场景及弹窗切换时同步清理按下状态，稳定键包含场景域。
    this.scope = dialog ? 'dialog:' + dialog.type + ':' + model.phase
      : model.phase === 'home' ? 'home:' + viewPage : 'game:' + model.phase;
    if (this.pressFeedback) this.pressFeedback.setScope(this.scope);
    const ctx = this.ctx;
    ctx.save();
    this.viewport.useFullScreen(ctx);
    this.drawScreenBackground(ctx, this.viewport.width, this.viewport.height, skinId);
    ctx.save();
    this.viewport.useDesignSpace(ctx);
    if (model.phase === 'home') {
      if (viewPage === 'skins') this.drawSkins(ctx, skinId);
      else if (viewPage === 'settings') this.drawSettings(ctx, soundSettings);
      else this.drawHome(ctx, homeIntro);
    } else this.drawGame(ctx, model, revealProgress, isAnimating, previousAiFist, playerHandAnimation);
    if (dialog) {
      // 清除底层点击区：两个弹窗都只响应关闭与翻页，不会误触游戏按钮。
      this.hitAreas = [];
      if (dialog.type === 'rules' && model.phase === 'home') {
        drawPagedDialog(ctx, {
          title: '玩法说明', content: CONFIG.RULES_TEXT, requestedPage: dialog.page
        }, (x, y, width, height, action) => this.addHitArea(x, y, width, height, action),
          (action) => this.pressProgress(action));
      } else if (dialog.type === 'history' && model.phase !== 'home') {
        drawPagedDialog(ctx, {
          title: '本局出码记录', content: this.formatHistory(model.history), requestedPage: dialog.page
        }, (x, y, width, height, action) => this.addHitArea(x, y, width, height, action),
          (action) => this.pressProgress(action));
      }
    }
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
    // 首页玩法说明使用书本图标；对局出码记录仍使用原 rule.png。
    this.drawIconButton(ctx, 'rules', rules.x, rules.y, rules.width,
      rules.height, { type: 'OPEN_RULES' }, 'iconBook');
    const settings = home.settings;
    this.drawIconButton(ctx, 'settings', settings.x, settings.y, settings.width,
      settings.height, { type: 'OPEN_SETTINGS' });
  }

  /** 将已结算记录按最新优先格式化，供可复用弹窗按段分页。每段是一条完整的出码记录。 */
  formatHistory(records) {
    if (!records || records.length === 0) {
      return '本局暂无出码记录。\n完成首次出拳和喊码后，将自动记录在这里。';
    }
    // 仅倒序展示，不修改游戏模型中按时间顺序写入的原始历史记录。
    return records.slice().reverse().map((item) => {
      let outcome = '不计分';
      if (item.outcome === 'player') outcome = '你 +1 分';
      else if (item.outcome === 'ai') outcome = '电脑 +1 分';
      else if (item.playerHit && item.aiHit) outcome = '双方猜中，不计分';
      return [
        '第 ' + item.roundNumber + ' 码 · ' + outcome,
        '你：出拳 ' + item.player.fist + ' / 喊码 ' + item.player.call,
        '电脑：出拳 ' + item.ai.fist + ' / 喊码 ' + item.ai.call,
        '出拳合计：' + item.total
      ].join('\n');
    }).join('\n\n');
  }

  /** 设置页中的音量状态仅用于 UI 展示，不影响实际音频。 */
  drawSettings(ctx, soundSettings) {
    const back = theme.iconLayout.back;
    this.drawIconButton(ctx, 'back', back.x, back.y, back.width, back.height,
      { type: 'CLOSE_SETTINGS' });

    const S = theme.settingsLayout;
    UI.label(ctx, '游戏设置', 187.5, S.titleY, {
      size: 29, bold: true, color: C.primaryText, align: 'center'
    });
    UI.label(ctx, '选择喜欢的游戏外观与声音偏好', 187.5, S.subtitleY, {
      size: F.detail, color: C.secondaryText, align: 'center'
    });

    const skinAction = { type: 'OPEN_SKINS' };
    const skinProgress = this.pressProgress(skinAction);
    UI.withPress(ctx, S.x, S.skin.y, S.width, S.skin.height, skinProgress, 'card', () => {
      UI.panel(ctx, S.x, S.skin.y, S.width, S.skin.height);
      UI.pressTint(ctx, S.x, S.skin.y, S.width, S.skin.height, theme.radii.panel, skinProgress);
      UI.label(ctx, '更换皮肤', S.labelX, S.skin.y + S.skin.height / 2, {
        size: 21, color: C.primaryText, bold: true
      });
      this.drawSettingsAsset(ctx, 'iconSkin', S.skinIcon.x,
        S.skin.y + (S.skin.height - S.skinIcon.size) / 2, S.skinIcon.size, '▣');
    });
    this.addHitArea(S.x, S.skin.y, S.width, S.skin.height, skinAction);

    const settings = soundSettings || {
      music: { volume: 50, muted: false }, effects: { volume: 100, muted: false }
    };
    this.drawVolumeSetting(ctx, '游戏音乐', 'music', settings.music, S.music);
    this.drawVolumeSetting(ctx, '游戏音效', 'effects', settings.effects, S.effects);
  }

  drawSettingsAsset(ctx, key, x, y, size, fallback) {
    const image = this.images.get(key);
    if (image) {
      ctx.drawImage(image, x, y, size, size);
    } else {
      UI.label(ctx, fallback, x + size / 2, y + size / 2, {
        size: 28, color: C.primaryText, align: 'center'
      });
    }
  }

  drawVolumeSetting(ctx, title, channel, setting, layout) {
    const S = theme.settingsLayout;
    const volume = Math.max(0, Math.min(100, Math.round(setting.volume)));
    const iconKey = setting.muted ? 'iconMute' : volume === 0 ? 'iconNoAudio' : 'iconAudio';
    UI.panel(ctx, S.x, layout.y, S.width, layout.height);
    UI.label(ctx, title, S.labelX, layout.y + 28, {
      size: 21, color: C.primaryText, bold: true
    });

    const iconY = layout.y + S.track.offsetY - S.audioIcon.size / 2;
    const muteAction = { type: 'TOGGLE_VOLUME_MUTE', channel };
    UI.withPress(ctx, S.audioIcon.x, iconY, S.audioIcon.size, S.audioIcon.size,
      this.pressProgress(muteAction), 'icon', () => {
        this.drawSettingsAsset(ctx, iconKey, S.audioIcon.x, iconY, S.audioIcon.size,
          setting.muted ? '×' : volume === 0 ? '○' : '♪');
      });
    this.addHitArea(S.audioIcon.x, iconY,
      S.audioIcon.size, S.audioIcon.size, muteAction);

    const track = S.track;
    const sliderAction = { type: 'SET_VOLUME', channel, trackX: track.x, trackWidth: track.width };
    const sliderProgress = this.pressProgress(sliderAction);
    const trackY = layout.y + track.offsetY;
    roundedRect(ctx, track.x, trackY - 4, track.width, 8, 4, C.surfaceMuted);
    if (volume > 0) {
      roundedRect(ctx, track.x, trackY - 4, track.width * volume / 100,
        8, 4, C.accent);
    }
    const thumbX = track.x + track.width * volume / 100;
    ctx.beginPath();
    ctx.arc(thumbX, trackY, 10 + 2.5 * sliderProgress, 0, Math.PI * 2);
    ctx.fillStyle = C.accent;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = C.primaryText;
    ctx.stroke();
    UI.label(ctx, volume + '%', S.percentX, trackY + 1, {
      size: 15, color: C.primaryText, align: 'right'
    });
    // 可点击轨道，也可在触摸移动时持续更新；轨道两端可准确达到 0%/100%。
    this.addHitArea(track.x - 12, trackY - 22, track.width + 24, 44, sliderAction);
  }

  /** 皮肤选择页：只更换视觉资源，不影响比分和出码规则。 */
  drawSkins(ctx, activeId) {
    const back = theme.iconLayout.back;
    this.drawIconButton(ctx, 'back', back.x, back.y, back.width, back.height,
      { type: 'CLOSE_SKINS' });
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
      const action = { type: 'SELECT_SKIN', id: skin.id };
      const progress = this.pressProgress(action);
      UI.withPress(ctx, x, y, S.width, S.rowHeight, progress, 'card', () => {
        roundedRect(ctx, x, y, S.width, S.rowHeight, 14,
          selected ? C.surfaceRaised : C.surface,
          selected ? C.accent : C.border);
        UI.pressTint(ctx, x, y, S.width, S.rowHeight, 14, progress);
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
      });
      this.addHitArea(x, y, S.width, S.rowHeight, action);
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

  drawIconButton(ctx, name, x, y, width, height, action, imageKey) {
    const key = imageKey || { rules: 'iconRule', settings: 'iconSettings', back: 'iconBack', home: 'iconHome' }[name];
    UI.iconButton(ctx, name, this.images.get(key), x, y, width, height,
      { pressProgress: this.pressProgress(action) });
    if (action) this.addHitArea(x, y, width, height, action);
  }

  drawGame(ctx, model, revealProgress, isAnimating, previousAiFist, playerHandAnimation) {
    const result = model.lastResult;
    // 图层顺序：上下手势 → 中间信息 → 两侧操作区和图标；保证按钮清晰可点。
    this.drawAiArea(ctx, result, {
      progress: isAnimating ? revealProgress : 1,
      isAnimating,
      previousFist: previousAiFist
    });
    this.drawPlayerArea(ctx, model, playerHandAnimation);
    this.drawGameText(ctx, model);

    const history = L.history;
    this.drawIconButton(ctx, 'rules', history.x, history.y, history.width, history.height,
      { type: 'OPEN_HISTORY' });
    UI.label(ctx, '出码记录', history.x + history.width / 2, history.labelY, {
      size: F.note, color: C.secondaryText, align: 'center'
    });

    if (model.phase === 'over') {
      const b = L.restart;
      this.drawActionButton(ctx, '再玩一局', b.x, b.y, b.width, b.height,
        isAnimating ? null : { type: 'START' });
    } else {
      this.drawPickingControls(ctx, model);
    }
    const home = theme.iconLayout.home;
    this.drawIconButton(ctx, 'home', home.x, home.y, home.width, home.height,
      { type: 'RETURN_HOME' });
  }

  drawAiArea(ctx, result, animation) {
    drawHand(ctx, this.images, result ? result.ai.fist : null, animation);
    UI.label(ctx, '电脑喊码', L.call.x, L.call.labelY, {
      size: F.miniLabel, color: C.secondaryText, align: 'center'
    });
    if (result) {
      UI.label(ctx, result.ai.call, L.call.x, L.call.numberY, {
        size: 48, color: C.aiCallText || C.accent, bold: true, align: 'center'
      });
    } else {
      UI.label(ctx, '—', L.call.x, L.call.numberY, {
        size: 35, color: C.secondaryText, align: 'center'
      });
    }
  }

  drawPlayerArea(ctx, model, animation) {
    // 玩家只是选择数字时不切换手势；正式出码后 lastResult 才更新。
    // 首轮未出码前，保留半透明握拳待机姿势。
    const fist = model.lastResult ? model.lastResult.player.fist : 0;
    drawPlayerHand(ctx, this.images, fist, Object.assign({
      neutral: !model.lastResult
    }, animation || {}));
  }

  drawGameText(ctx, model) {
    UI.label(ctx,
      '你 ' + model.score.player + ' : ' + model.score.ai + ' 电脑  ·  第 ' + model.roundNumber + ' 码',
      187.5, L.scoreY, {
        size: F.compactScore, color: C.secondaryText, align: 'center', maxWidth: 172
      });

    const result = model.lastResult;
    if (!result || model.phase === 'picking') {
      UI.label(ctx, '先出拳 · 再喊码', 187.5, L.detailY, {
        size: F.note, color: C.primaryText, align: 'center', maxWidth: 172
      });
      UI.label(ctx, '点右侧数字自动开码', 187.5, L.outcomeY, {
        size: F.note, color: C.secondaryText, align: 'center', maxWidth: 172
      });
      return;
    }
    UI.label(ctx,
      '合计 ' + result.total + ' · 你出 ' + result.player.fist + ' / 喊 ' + result.player.call,
      187.5, L.detailY, {
        size: F.note, color: C.primaryText, align: 'center', maxWidth: 172
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
      size: F.detail, bold: true, color, align: 'center', maxWidth: 172
    });
  }

  drawPickingControls(ctx, model) {
    const p = L.picking;
    const picking = model.phase === 'picking';
    const fistSelected = model.player.fist !== null;

    // 左侧一列：0～5，按视觉顺序与触摸热区保持一一对应。
    UI.label(ctx, '你的出拳', p.fist.labelX, p.fist.labelY, {
      size: F.miniLabel, color: C.secondaryText
    });
    for (let i = 0; i <= 5; i += 1) {
      const y = p.fist.y + i * (p.fist.height + p.fist.rowGap);
      this.drawPickButton(ctx, String(i), p.fist.x, y,
        p.fist.width, p.fist.height, model.player.fist === i,
        picking ? { type: 'FIST', value: i } : null, !picking);
    }

    // 右侧两列按列优先排列：左列 0～4，右列 6～10（禁止喊 5）。
    UI.label(ctx, '你的喊码', p.call.labelX, p.call.labelY, {
      size: F.miniLabel, color: C.secondaryText, align: 'center'
    });
    for (let n = CONFIG.PLAYER_CALL_MIN; n <= CONFIG.PLAYER_CALL_MAX; n += 1) {
      if (n === CONFIG.FORBIDDEN_CALL) continue;
      const column = n < CONFIG.FORBIDDEN_CALL ? 0 : 1;
      const row = n < CONFIG.FORBIDDEN_CALL
        ? n - CONFIG.PLAYER_CALL_MIN : n - CONFIG.FORBIDDEN_CALL - 1;
      const x = p.call.x + column * (p.call.width + p.call.columnGap);
      const y = p.call.y + row * (p.call.height + p.call.rowGap);
      const available = picking && fistSelected;
      this.drawPickButton(ctx, String(n), x, y, p.call.width, p.call.height,
        model.player.call === n,
        available ? { type: 'CALL', value: n } : null, !available);
    }
  }

  drawPickButton(ctx, value, x, y, width, height, selected, action, disabled) {
    UI.button(ctx, value, x, y, width, height,
      { selected, disabled, pressProgress: this.pressProgress(action) });
    if (action) this.addHitArea(x, y, width, height, action);
  }

  drawActionButton(ctx, value, x, y, width, height, action) {
    UI.button(ctx, value, x, y, width, height,
      { primary: true, disabled: !action, pressProgress: this.pressProgress(action) });
    if (action) this.addHitArea(x, y, width, height, action);
  }

  /** action.id 是业务皮肤 ID，不可直接当作 UI 目标 ID；加入类型及场景避免重名。 */
  targetId(action) {
    if (!action) return null;
    return this.scope + ':' + action.type + ':' +
      (action.id == null ? '' : String(action.id)) + ':' +
      (action.value == null ? '' : String(action.value)) + ':' +
      (action.channel == null ? '' : String(action.channel));
  }

  pressProgress(action) {
    return this.pressFeedback && action
      ? this.pressFeedback.getProgress(this.targetId(action)) : 0;
  }

  addHitArea(x, y, width, height, action) {
    if (!action) return;
    this.hitAreas.push({ id: this.targetId(action), x, y, width, height, action });
  }

  hitTestTarget(x, y) {
    for (let i = this.hitAreas.length - 1; i >= 0; i -= 1) {
      const area = this.hitAreas[i];
      if (x >= area.x && x <= area.x + area.width && y >= area.y && y <= area.y + area.height) {
        return area;
      }
    }
    return null;
  }

  /** 兼容原有调用方：hitTest 仍返回 action 而非 UI 目标信息。 */
  hitTest(x, y) {
    const area = this.hitTestTarget(x, y);
    if (!area) return null;
    const action = area.action;
    if (action.type === 'SET_VOLUME') {
      return Object.assign({}, action, {
        value: Math.max(0, Math.min(100,
          Math.round((x - action.trackX) * 100 / action.trackWidth)))
      });
    }
    return action;
  }
}

module.exports = CanvasRenderer;
