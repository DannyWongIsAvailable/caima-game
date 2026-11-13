# 广西猜码 · 微信小游戏

基于 **原生 JavaScript + Canvas 2D** 开发的单人 PVE 广西猜码小游戏，可在微信开发者工具中作为「小游戏」项目打开。项目不依赖游戏引擎、WXML、后端服务或数据库。

## 功能与玩法

- 玩家每轮选择出拳 `0～5`、喊码 `0～10`（不含 `5`），出拳仍可选 `5`，出拳和喊码之间没有大小限制。
- 电脑随机出拳 `0～5`，其喊码满足 `电脑出拳 ≤ 电脑喊码 ≤ 电脑出拳 + 5`，且不会喊 `5`；从合法候选中随机选择。
- 双方喊码与两人出拳总和比较：只有一方猜中时，该方得 1 分；双方都猜中或都未猜中时不计分。
- 对战页的“出码记录”按钮位于右侧喊码数字选项的下方、玩家手势右侧。
- 玩家选择喊码后自动结算；电脑上一轮的出拳和喊码会保留到新结果出现；旧手收回、新手从屏幕顶部伸出；展示结果后自动开始下一轮。
- 先达到目标分数者获胜。首页只有“猜码”标题、“开始游戏”和“设置”入口；设置页进入皮肤选择页，游戏页可以返回首页。
- 六套皮肤（岭南墨绿、桂林山水、壮乡锦绣、岭南柑橙、夜色霓灯、桂乡稻田）同步切换背景图片及控件配色，并通过微信本地存储记住选择。

## 技术架构

项目采用 **入口 / 应用控制 / 领域模型 / 输入 / 绘制 / 主题 / 媒体 / 动画** 的分层方式：

```text
.
├── game.js                       # 微信小游戏启动入口
├── game.json                     # 小游戏配置
├── project.config.json           # 微信开发者工具项目配置
├── package.json                  # 本地测试脚本
├── src/
│   ├── app.js                     # 游戏控制器：页面导航、交互分发、计时与动画协调
│   ├── config/
│   │   └── game-config.js         # 玩法参数、分数目标、动画与结算时长
│   ├── core/
│   │   ├── rules.js               # 纯规则：合法性检查、电脑出码、胜负判定
│   │   └── game-model.js          # 状态模型：玩家选择、回合、比分和阶段流转
│   ├── input/
│   │   └── touch-controller.js    # 触摸坐标转换与命中动作分发
│   ├── renderer/
│   │   ├── canvas-renderer.js     # 首页、设置页、皮肤页、对战页绘制及点击区域
│   │   ├── ai-hand.js             # 电脑手势绘制及伸手过渡效果
│   │   ├── ui-components.js       # 通用按钮、卡片、文字等绘图组件
│   │   ├── draw-utils.js          # Canvas 绘制辅助函数
│   │   ├── viewport.js            # 屏幕尺寸、像素比与设计坐标适配
│   │   └── theme.js               # 绘制层的主题相关辅助
│   ├── theme/
│   │   ├── tokens.js              # 字体、间距、圆角、布局和当前动态色板
│   │   ├── skins.js               # 皮肤元数据、背景/缩略图路径、色板定义
│   │   └── skin-manager.js        # 当前皮肤、切换与本地存储
│   ├── media/
│   │   ├── media-manifest.js      # 手势图、音频、动画素材的统一配置
│   │   ├── image-loader.js        # 图片加载、背景按需加载、预览缓存
│   │   └── audio-manager.js       # 音频创建和播放
│   └── animation/
│       └── reveal-animator.js     # 出码动画的逐帧进度驱动
├── assets/
│   ├── images/
│   │   ├── skins/                # 皮肤背景和 previews/ 缩略图
│   │   └── icons/                # 96×96 PNG：settings、back、home 导航图标
│   ├── audio/                    # 可选音效素材
│   └── animations/               # 可选序列帧素材
└── tests/
    ├── rules.test.js             # 规则测试
    ├── smoke.test.js             # 主要交互与绘制模拟测试
    └── skin.test.js              # 皮肤、缓存、页面切换等测试
```

### 分层职责

1. **`game.js`** 创建 `MiniGameApp`，交由 `src/app.js` 完成初始化。
2. **`app.js`** 负责协调，不直接包含 Canvas 绘图细节或猜码规则。它连接 `GameModel`、`CanvasRenderer`、`TouchController`、`RevealAnimator`、`ImageLoader`、`AudioManager` 和 `SkinManager`。
3. **`core/`** 是玩法逻辑层，不依赖微信 API 或 Canvas。需要修改玩法时优先调整 `rules.js` 和 `game-model.js`。
4. **`renderer/`** 只负责将模型和主题绘制到 Canvas，并登记按钮命中区域；不决定胜负或推进回合。
5. **`input/`** 将微信触摸事件映射到画布设计坐标，执行绘制层提供的命中检测，将动作交回控制器。
6. **`theme/`** 集中管理皮肤、全局颜色与布局参数；**`media/`** 负责素材声明和加载；**`animation/`** 只产生动画进度。

## 核心交互与状态

```text
微信触摸事件
    ↓
TouchController（坐标 / 命中）
    ↓
MiniGameApp.dispatch(action)
    ├── GameModel（选择、结算、比分、阶段）
    ├── RevealAnimator（进度 → 重新绘制）
    ├── SkinManager（切换皮肤 / 存储）
    ├── ImageLoader / AudioManager（资源）
    └── CanvasRenderer（界面绘制）
```

页面导航（不参与对战模型）：

```text
首页 ── 设置 ── 更换皮肤（选择皮肤）
  ↑      ↑                │
  └──────┘      返回设置 ──┘
首页 ── 开始游戏 ── 对战页 ── 返回首页
```

设置页仅提供“更换皮肤”入口和返回导航；皮肤选择页返回时回到设置页，而不是直接回首页。

对战模型状态：

```text
home → picking → result → picking → ...
                      └── over（达到目标分数）
```

玩家先选择出拳，再选择喊码；第二次选择直接触发 `submit()`，无需出码确认按钮。自动下一轮只清空玩家本轮的选择，保留 `lastResult`，因此电脑手势和喊码不会闪回问号。返回首页时，控制器会停止动画并清理自动下一轮的计时任务，避免已退出的对局继续变化。

## 皮肤与资源

### 皮肤系统

- `src/theme/skins.js` 定义每套皮肤的 ID、名字、背景路径、预览路径和配色。
- `src/theme/skin-manager.js` 读取/写入 `wx.getStorageSync`、`wx.setStorageSync`，并更新当前主题色板。
- `src/theme/tokens.js` 提供全局颜色对象和排版、布局常量；肤色对比度由 `skins.js` 的语义颜色统一控制。对浅色皮肤可单独定义 `buttonSurface`、`buttonText`、`navSurface`、`homeTitleText`、`aiCallText` 和 `selectedIndicator`，避免低对比度。
- `src/media/image-loader.js` 按需加载当前皮肤大背景，预加载小尺寸预览图，避免快速切换时将旧背景绘制到新皮肤上。背景加载失败时使用该皮肤的渐变色占位。

皮肤背景存放在 `assets/images/skins/`，对应缩略图放在 `assets/images/skins/previews/`。新增皮肤需要同时登记配色、背景及缩略图路径。

### 可选媒体资源

手势、音效和序列帧的资源开关统一配置在 `src/media/media-manifest.js`。未启用或缺少这些素材时，游戏仍使用 Canvas 占位绘制并正常运行。

- **导航图标**：`assets/images/icons/settings.png`、`back.png`、`home.png`，96×96 透明 PNG；由 `ImageLoader` 加载并通过统一 UI 组件绘制，保留原按钮触摸区域。
- **手势图片**：`assets/images/hand-0.png` 至 `hand-5.png`，推荐透明 PNG，顶部为手腕、手指朝下。
- **音效**：`assets/audio/`，可配置点击、出码、输赢和平局等音效。
- **动画序列帧**：`assets/animations/`，预留 `reveal-strip.png`。

顶部伸手动画由 `src/animation/reveal-animator.js` 提供进度、`src/renderer/ai-hand.js` 负责绘制；替换手势图片不会改变游戏规则。

## 运行与测试

1. 在微信开发者工具中新建或导入**小游戏**项目，选择项目根目录。
2. 根据需要在 `project.config.json` 配置自己的小游戏 AppID。
3. 编译预览；正式发布前请在真实手机上检查触摸区域、手势图片、动画、皮肤加载和屏幕适配。
4. 本地安装 Node.js 后，在项目根目录运行 `npm test` 执行已有的纯 JS 测试（无需安装第三方运行时依赖）。

## 常见扩展入口

| 需求 | 主要文件 |
|---|---|
| 调整判定规则、人机随机策略 | `src/core/rules.js` |
| 调整比分目标、动画时长 | `src/config/game-config.js` |
| 调整回合阶段、得分与清空逻辑 | `src/core/game-model.js` |
| 调整页面布局、按钮位置 | `src/renderer/canvas-renderer.js`、`src/theme/tokens.js` |
| 增加统一 UI 组件 | `src/renderer/ui-components.js` |
| 添加或调整皮肤 | `src/theme/skins.js`、`assets/images/skins/` |
| 增加手势图片、音效 | `src/media/media-manifest.js`、`assets/` |
| 调整电脑伸手效果 | `src/renderer/ai-hand.js`、`src/animation/reveal-animator.js` |
| 添加页面或按钮行为 | `src/app.js`、`src/renderer/canvas-renderer.js` |

建议持续保持 **规则和状态独立于绘制、资源独立于玩法、风格统一由主题层管理**，便于后续增加音效、手势动画、皮肤以及其他对战模式。
