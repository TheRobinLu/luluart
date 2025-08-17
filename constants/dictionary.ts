const words = [
	{ en: "Home", cn: "首页" },
	{ en: "About", cn: "关于" },
	{ en: "Contact", cn: "联系" },
	{ en: "Open", cn: "打开" },
	{ en: "Save", cn: "保存" },
	{ en: "Crop", cn: "裁剪" },
	{ en: "Rotate", cn: "旋转" },
	{ en: "Flip", cn: "翻转" },
	{ en: "Tone", cn: "色调" },
	{ en: "Toolbox", cn: "工具箱" },
	{ en: "File", cn: "文件" },
	{ en: "Apply", cn: "应用" },
	{ en: "Cancel", cn: "取消" },
	{ en: "Settings", cn: "设置" },
	{ en: "Language", cn: "语言" },
	{ en: "History", cn: "历史" },
	{ en: "Zoom", cn: "缩放" },
	{ en: "No file loaded", cn: "未加载文件" },
	{ en: "Brightness", cn: "亮度" },
	{ en: "Contrast", cn: "对比度" },
	{ en: "Saturation", cn: "色饱和" },
	{ en: "Sepia", cn: "褐色" },
	{ en: "Hue", cn: "色相" },
	{ en: "AI", cn: "人工智能" },
	{ en: "Original", cn: "原图" },
	{ en: "AI Tools", cn: "智能工具箱" },
	{ en: "Background", cn: "背景" },
	{ en: "Beautify", cn: "美颜" },
	{ en: "Lights", cn: "光效" },
	{ en: "Styles", cn: "风格" },
	{ en: "Frame", cn: "边框" },
	{ en: "Filter", cn: "滤镜" },
	{ en: "Text", cn: "文字" },
	{ en: "Sticker", cn: "贴纸" },
	{ en: "Draw", cn: "绘制" },
	{ en: "Erase", cn: "擦除" },
	{ en: "Adjustments", cn: "调整" },
	{ en: "Sharpen", cn: "锐化" },
	{ en: "Blur", cn: "模糊" },
	{ en: "Noise", cn: "噪点" },
	{ en: "Vignette", cn: "晕影" },
	{ en: "Perspective", cn: "透视" },
	{ en: "Transform", cn: "变形" },
	{ en: "Resize", cn: "调整大小" },
	{ en: "Export", cn: "导出" },
	{ en: "Import", cn: "导入" },
	{ en: "Undo", cn: "撤销" },
	{ en: "Redo", cn: "重做" },
	{ en: "Layers", cn: "图层" },
	{ en: "Masking", cn: "蒙版" },
	{ en: "Repair", cn: "修复" },
	{ en: "Environment", cn: "环境" },
	{ en: "Portrait", cn: "肖像" },
	{ en: "Entity", cn: "主体" },
	{ en: "Fantastic", cn: "奇幻" },
	{ en: "Color", cn: "颜色" },
	{ en: "Texture", cn: "纹理" },
	{ en: "Replace", cn: "替换" },
	{ en: "Prompt", cn: "提示词" },

	// ...add more as needed
];

export default function getText(lang: string, lable: string): string {
	let wording = "";

	if (lang === "CN") {
		const index = words.findIndex(
			(item) => item.en.toLowerCase() === lable.toLowerCase()
		);
		wording = index === -1 ? lable : words[index].cn;
	} else {
		wording = lable;
	}
	return wording;
}
