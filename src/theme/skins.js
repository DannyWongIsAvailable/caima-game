/**
 * 皮肤清单：图片、预览图和一整套颜色在同一条配置里管理。
 * 皮肤与玩法逻辑无关；如需增加皮肤，沿用已有字段新增一项即可。
 */
const directory = 'assets/images/skins/';

const SKINS = [
  {
    id: 'a', name: '岭南墨绿', subtitle: '经典沉稳 · 竹影青山',
    background: directory + 'skin-a-jade-green.png',
    preview: directory + 'previews/skin-a-jade-green-preview.png',
    swatches: ['#073D39', '#367F6A', '#F2C96F'],
    colors: {
      bgTop: '#0B3831', bgBottom: '#06251F', backgroundPattern: 'rgba(242,201,111,0.05)',
      backdrop: 'rgba(1,27,24,0.17)', bottomVeil: 'rgba(1,25,22,0.62)',
      surface: 'rgba(15,54,47,0.91)', surfaceRaised: 'rgba(38,89,74,0.94)',
      surfaceMuted: '#254B41', notice: '#25473C', border: 'rgba(183,216,191,0.28)',
      divider: 'rgba(216,233,214,0.20)', accent: '#F2C96F', accentText: '#18352D',
      primaryText: '#FFF9E9', secondaryText: '#D2E2D6', disabledText: '#9AB7AA',
      disabledSurface: 'rgba(30,60,51,0.84)', success: '#8DE7B9', danger: '#FFD0B7',
      coinSurface: '#2E5C4A', homeCoinSurface: '#305E4C',
      handPlaceholder: 'rgba(45,113,92,0.29)', handOutline: 'rgba(205,233,210,0.37)'
    }
  },
  {
    id: 'b', name: '桂林山水', subtitle: '清新自然 · 碧水青峰',
    background: directory + 'skin-b-guilin-water.png',
    preview: directory + 'previews/skin-b-guilin-water-preview.png',
    swatches: ['#073C59', '#40A5B8', '#FFE099'],
    colors: {
      bgTop: '#105979', bgBottom: '#117B89', backgroundPattern: 'rgba(255,255,255,0.045)',
      backdrop: 'rgba(3,42,66,0.22)', bottomVeil: 'rgba(0,34,54,0.66)',
      surface: 'rgba(8,55,78,0.91)', surfaceRaised: 'rgba(29,105,126,0.95)',
      surfaceMuted: '#22657C', notice: '#1D6175', border: 'rgba(191,235,246,0.30)',
      divider: 'rgba(229,249,253,0.18)', accent: '#FFE099', accentText: '#183F50',
      primaryText: '#FAFFFF', secondaryText: '#D5F0F3', disabledText: '#A5CAD5',
      disabledSurface: 'rgba(12,65,84,0.91)', success: '#AAFFD8', danger: '#FFD0B4',
      coinSurface: '#1C728B', homeCoinSurface: '#1D7592',
      handPlaceholder: 'rgba(37,142,173,0.34)', handOutline: 'rgba(223,250,255,0.38)'
    }
  },
  {
    id: 'c', name: '壮乡锦绣', subtitle: '壮锦纹样 · 靛蓝紫韵',
    background: directory + 'skin-c-zhuang-brocade.png',
    preview: directory + 'previews/skin-c-zhuang-brocade-preview.png',
    swatches: ['#242C76', '#8155B0', '#FFBD7F'],
    colors: {
      bgTop: '#1B2866', bgBottom: '#392576', backgroundPattern: 'rgba(234,177,255,0.04)',
      backdrop: 'rgba(15,12,62,0.18)', bottomVeil: 'rgba(17,11,55,0.58)',
      surface: 'rgba(41,39,104,0.91)', surfaceRaised: 'rgba(88,67,142,0.94)',
      surfaceMuted: '#504580', notice: '#4B4478', border: 'rgba(209,188,255,0.30)',
      divider: 'rgba(224,211,255,0.19)', accent: '#FFCE85', accentText: '#382D5C',
      primaryText: '#FAF5FF', secondaryText: '#DFD9F6', disabledText: '#AFA5D2',
      disabledSurface: 'rgba(48,41,94,0.92)', success: '#A9F5CD', danger: '#FFB6B2',
      coinSurface: '#5A478D', homeCoinSurface: '#604994',
      handPlaceholder: 'rgba(140,100,202,0.28)', handOutline: 'rgba(234,218,255,0.38)'
    }
  },
  {
    id: 'd', name: '岭南柑橙', subtitle: '热情喜庆 · 花开云涌',
    background: directory + 'skin-d-lingnan-orange.png',
    preview: directory + 'previews/skin-d-lingnan-orange-preview.png',
    swatches: ['#9C2428', '#F07943', '#FFE8B2'],
    colors: {
      bgTop: '#9A252C', bgBottom: '#F06D37', backgroundPattern: 'rgba(255,224,172,0.04)',
      backdrop: 'rgba(100,14,14,0.16)', bottomVeil: 'rgba(91,19,19,0.68)',
      surface: 'rgba(127,28,32,0.88)', surfaceRaised: 'rgba(181,62,45,0.94)',
      surfaceMuted: '#AF493A', notice: '#A73F36', border: 'rgba(255,221,172,0.32)',
      divider: 'rgba(255,227,189,0.20)', accent: '#FFE2A6', accentText: '#762B25',
      primaryText: '#FFF6E9', secondaryText: '#FFE5D1', disabledText: '#F2BEAB',
      disabledSurface: 'rgba(135,41,43,0.90)', success: '#BDFFD5', danger: '#FFD3A5',
      coinSurface: '#C3513D', homeCoinSurface: '#C5563E',
      handPlaceholder: 'rgba(242,138,93,0.27)', handOutline: 'rgba(255,232,196,0.41)'
    }
  },
  {
    id: 'e', name: '夜色霓灯', subtitle: '南宁夜景 · 都市流光',
    background: directory + 'skin-e-nanning-neon.png',
    preview: directory + 'previews/skin-e-nanning-neon-preview.png',
    swatches: ['#09245B', '#3177EE', '#79E0FA'],
    colors: {
      bgTop: '#071B53', bgBottom: '#092C77', backgroundPattern: 'rgba(107,189,255,0.04)',
      backdrop: 'rgba(1,14,52,0.13)', bottomVeil: 'rgba(2,16,58,0.59)',
      surface: 'rgba(15,40,96,0.91)', surfaceRaised: 'rgba(31,83,151,0.95)',
      surfaceMuted: '#274D89', notice: '#20437E', border: 'rgba(149,198,255,0.31)',
      divider: 'rgba(170,208,255,0.19)', accent: '#8DE9FF', accentText: '#082C58',
      primaryText: '#F3F8FF', secondaryText: '#CDDFFE', disabledText: '#96B9E4',
      disabledSurface: 'rgba(19,51,105,0.90)', success: '#9DFFD9', danger: '#FFB4C9',
      coinSurface: '#2258A8', homeCoinSurface: '#2865BA',
      handPlaceholder: 'rgba(54,117,221,0.31)', handOutline: 'rgba(174,214,255,0.40)'
    }
  },
  {
    id: 'f', name: '桂乡稻田', subtitle: '温暖亲和 · 稻香桂韵',
    background: directory + 'skin-f-guixiang-ricefields.png',
    preview: directory + 'previews/skin-f-guixiang-ricefields-preview.png',
    swatches: ['#4B763E', '#F4B442', '#FFF0CF'],
    colors: {
      // 浅色皮肤：深棕文字与奶油色卡片，绿色实体按钮、暖金选中状态。
      bgTop: '#D7E7D7', bgBottom: '#FFE7A5', backgroundPattern: 'rgba(100,108,62,0.05)',
      backdrop: 'rgba(255,247,220,0.04)', bottomVeil: 'rgba(255,243,209,0.50)',
      surface: 'rgba(255,248,228,0.94)', surfaceRaised: 'rgba(246,230,194,0.96)',
      surfaceMuted: '#F1E2BA', notice: '#F8EBCB', border: 'rgba(111,111,64,0.36)',
      divider: 'rgba(95,93,56,0.18)', accent: '#F4B442', accentText: '#302B1E',
      primaryText: '#403522', secondaryText: '#66553D', disabledText: '#6B745D',
      disabledSurface: 'rgba(207,202,172,0.94)', success: '#28743D', danger: '#AC4735',
      coinSurface: '#6C8F4A', homeCoinSurface: '#789853',
      handPlaceholder: 'rgba(255,248,226,0.35)', handOutline: 'rgba(91,123,75,0.57)',
      // 新的可选语义色确保浅色背景上的普通按钮与数字清晰可辨。
      buttonSurface: '#52753E', buttonText: '#FFF8EA', navSurface: '#52753E',
      homeTitleText: '#466D35', aiCallText: '#416831', selectedIndicator: '#416831'
    }
  }
];

function findSkin(id) {
  return SKINS.find((skin) => skin.id === id) || null;
}

module.exports = { SKINS, findSkin, DEFAULT_SKIN_ID: 'a' };
