/**
 * 媒体资源统一配置。导航图标、首页人物和对战手势默认启用，其余可选资源默认关闭。
 * 以后：把素材放到 assets 对应目录，修改 src 和 enabled 即可。
 * 图片背景/手势通过 ImageLoader 自动加载；音频通过 AudioManager 自动播放。
 * revealStrip 可使用一行 8 帧的 PNG 透明序列图（宽度需能被 8 整除）。
 */
module.exports = {
  images: {
    // 导航图标始终启用，皮肤颜色变化不会改变图片本身。
    iconSettings: { src: 'assets/images/icons/settings.png', enabled: true },
    iconBook: { src: 'assets/images/icons/book.png', enabled: true },
    iconRule: { src: 'assets/images/icons/rule.png', enabled: true },
    iconBack: { src: 'assets/images/icons/back.png', enabled: true },
    iconHome: { src: 'assets/images/icons/home.png', enabled: true },
    // 设置页图标只负责视觉反馈；本版尚不接入真实音量控制。
    iconSkin: { src: 'assets/images/icons/skin.png', enabled: true },
    iconAudio: { src: 'assets/images/icons/audio.png', enabled: true },
    iconNoAudio: { src: 'assets/images/icons/no-audio.png', enabled: true },
    iconMute: { src: 'assets/images/icons/mute.png', enabled: true },
    // 首页人物由用户提供，原始图片 509×571；渲染时等比缩放。
    homeMan: { src: 'assets/images/man.png', enabled: true },
    background: { src: 'assets/images/background.jpg', enabled: false },
    hand0: { src: 'assets/images/hand/hand-0.png', enabled: true },
    hand1: { src: 'assets/images/hand/hand-1.png', enabled: true },
    hand2: { src: 'assets/images/hand/hand-2.png', enabled: true },
    hand3: { src: 'assets/images/hand/hand-3.png', enabled: true },
    hand4: { src: 'assets/images/hand/hand-4.png', enabled: true },
    hand5: { src: 'assets/images/hand/hand-5.png', enabled: true },
    revealStrip: { src: 'assets/animations/reveal-strip.png', enabled: false, frames: 8 }
  },
  audio: {
    tap: { src: 'assets/audio/tap.mp3', enabled: false },
    reveal: { src: 'assets/audio/reveal.mp3', enabled: false },
    win: { src: 'assets/audio/win.mp3', enabled: false },
    lose: { src: 'assets/audio/lose.mp3', enabled: false },
    draw: { src: 'assets/audio/draw.mp3', enabled: false }
  }
};
