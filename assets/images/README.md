# 图片资源说明

- `skins/skin-a-jade-green.png`～`skin-e-nanning-neon.png`：五张可切换背景。
- `skins/previews/*-preview.png`：皮肤选择页的轻量预览图。
- 背景路径、预览路径和颜色配置统一在 `src/theme/skins.js`。
- 旧 `background.jpg` 是 v0.2 预留的单一背景路径，当前背景由皮肤选择管理。
- `hand-0.png`～`hand-5.png`：电脑出拳的手势透明素材，仍是可选占位；需在 `src/media/media-manifest.js` 中逐项启用。

更换手势图/动画不影响皮肤逻辑，也不影响原有伸手动画和玩法规则。
