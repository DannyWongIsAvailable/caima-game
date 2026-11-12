/**
 * 全局视觉设计变量（Design Tokens）。
 * 改品牌色、字体、圆角、控件样式时优先改这里，不需要逐个改绘制文件。
 */
const theme = {
  colors: {
    bgTop: '#142B29',
    bgBottom: '#0A171B',
    backgroundPattern: 'rgba(242, 201, 111, 0.07)',
    backdrop: 'rgba(5, 25, 20, 0.59)',
    surface: '#203C35',
    surfaceRaised: '#2A483F',
    surfaceMuted: '#284239',
    notice: '#31483C',
    border: '#466359',
    divider: 'rgba(216, 233, 214, 0.14)',
    accent: '#F2C96F',
    accentText: '#172C27',
    primaryText: '#F7F3E7',
    secondaryText: '#B4C8BA',
    disabledText: '#8EA599',
    disabledSurface: '#32453D',
    success: '#77E0AC',
    danger: '#FFB59D',
    coinSurface: '#335B4A',
    homeCoinSurface: '#3D624C',
    handPlaceholder: 'rgba(84, 124, 108, 0.23)',
    handOutline: 'rgba(200, 221, 203, 0.25)'
  },
  typography: {
    family: 'sans-serif',
    title: 38,
    homeTitle: 72,
    logo: 42,
    section: 23,
    button: 23,
    score: 35,
    scoreDivider: 30,
    coinNumber: 28,
    number: 20,
    subtitle: 15,
    body: 14,
    detail: 13,
    note: 12,
    caption: 11,
    miniLabel: 12,
    compactScore: 13,
    aiCall: 58,
    handFallback: 52
  },
  radii: {
    hero: 25,
    panel: 18,
    scoreboard: 17,
    control: 9,
    button: 14,
    notice: 11,
    coin: 99
  },
  spacing: {
    page: 20,
    panelPadding: 15,
    buttonGap: 7
  },
  control: {
    pickSize: 49,
    fistHeight: 43,
    callHeight: 43,
    primaryHeight: 52
  },
  // 首页和设置页共享的布局坐标（375 × 720 设计空间）。
  homeLayout: {
    title: { x: 187.5, y: 235 },
    // 人物从右侧探出；以原图 509:571 的宽高比自动计算显示高度。
    character: { x: 194, y: 276, width: 181, exitX: 390 },
    bubble: { x: 37, y: 331, width: 151, height: 55 },
    start: { x: 42, y: 485, width: 291, height: 62 },
    settings: { x: 159.5, y: 561, width: 56, height: 56 },
    skinEntry: { x: 42, y: 335, width: 291, height: 62 }
  },
  // 统一导航图标按钮与图标本身尺寸（画布设计坐标）。
  iconLayout: {
    back: { x: 18, y: 16, width: 44, height: 44 },
    home: { x: 12, y: 15, width: 44, height: 44 },
    size: { settings: 37, back: 29, home: 29 }
  },
  // 皮肤选择页：375 × 720 设计空间内最多展示六套皮肤，不需要滚动。
  skinLayout: {
    x: 24, y: 122, width: 327, rowHeight: 84, rowGap: 7,
    previewX: 39, previewWidth: 42, previewHeight: 74,
    textX: 100, footerY: 690
  },
  // 对战页仅留绘图区域与数字操作区；这些是 375x720 设计空间坐标。
  // 修改这里可整体调整手势插画、喊码和按钮，不改变游戏逻辑。
  gameLayout: {
    hand: { x: 26, y: -38, width: 250, height: 381, enterY: 390 },
    call: { x: 311, labelY: 150, numberY: 217 },
    handCaption: { x: 145, y: 347 },
    scoreY: 374,
    detailY: 402,
    outcomeY: 425,
    picking: {
      x: 22, labelX: 22,
      fistLabelY: 456, fistButtonY: 472,
      callLabelY: 541, callFirstY: 557, callSecondY: 607,
      gap: 8
    },
    restart: { x: 24, y: 608, width: 327, height: 52 }
  }
};

module.exports = theme;
