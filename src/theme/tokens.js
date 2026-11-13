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
  // 首页布局坐标（375 × 720 设计空间）。
  homeLayout: {
    title: { x: 187.5, y: 235 },
    // 人物从右侧探出；以原图 509:571 的宽高比自动计算显示高度。
    character: { x: 194, y: 276, width: 181, exitX: 390 },
    bubble: { x: 37, y: 331, width: 151, height: 55 },
    start: { x: 72.5, y: 485, width: 230, height: 62 },
    // 首页玩法说明位于右上角，设置入口保留在右下角。
    rules: { x: 16, y: 32, width: 54, height: 54 },
    settings: { x: 305, y: 625, width: 54, height: 54 }
  },
  // 设置页：皮肤入口 + 两条仅控制显示状态的音量滑杆。
  settingsLayout: {
    titleY: 169, subtitleY: 203,
    x: 24, width: 327, labelX: 48,
    skin: { y: 245, height: 74 },
    music: { y: 337, height: 117 },
    effects: { y: 472, height: 117 },
    skinIcon: { x: 286, size: 42 },
    audioIcon: { x: 47, size: 42 },
    // 滑杆与 100% 文案之间预留间距，避免端点圆钮挤到百分比文字。
    track: { x: 110, width: 148, offsetY: 85 },
    percentX: 326
  },
  // 导航图标按钮的绘制区域与图片区域一致（画布设计坐标）。
  iconLayout: {
    back: { x: 18, y: 16, width: 44, height: 44 },
    home: { x: 12, y: 15, width: 44, height: 44 }
  },
  // 皮肤选择页：375 × 720 设计空间内最多展示六套皮肤，不需要滚动。
  skinLayout: {
    x: 24, y: 122, width: 327, rowHeight: 84, rowGap: 7,
    previewX: 39, previewWidth: 42, previewHeight: 74,
    textX: 100, footerY: 690
  },
  // 对战页：两只手分别贴住设计空间的上下边界，按钮移至左右边缘。
  // 375 × 720；手部 PNG 自带透明边，按原比例显示，避免变形。
  gameLayout: {
    // 额外向画布外延伸 30px 的手腕，抵消全面屏安全区的上下留白。
    hand: { x: 70, y: -30, width: 225, height: 305, enterY: 340 },
    playerHand: { x: 70, bottomY: 750, width: 225, height: 305, enterY: 340 },
    // 中央预留给电脑喊码、比分、每码结果；右上角保留出码记录入口。
    call: { x: 187.5, labelY: 291, numberY: 321 },
    history: { x: 314, y: 20, width: 42, height: 42, labelY: 79 },
    scoreY: 360,
    detailY: 384,
    outcomeY: 408,
    picking: {
      // 左侧一列：0～5；右侧两列：0～10。
      fist: { x: 14, y: 163, width: 46, height: 46, rowGap: 9, labelX: 14, labelY: 139 },
      call: { x: 276, y: 163, width: 43, height: 46, columnGap: 7, rowGap: 9,
        labelX: 322, labelY: 139 }
    },
    restart: { x: 97, y: 440, width: 181, height: 49 }
  }
};

module.exports = theme;
