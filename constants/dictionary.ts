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
	{ en: "History", cn: "历史" },
	{ en: "Zoom", cn: "缩放" },
	{ en: "File: ", cn: "文件：" },
	{ en: "No file loaded", cn: "未加载文件" },
	{ en: "Brightness", cn: "亮度" },
	{ en: "Contrast", cn: "对比度" },
	{ en: "Saturation", cn: "色饱和" },
	{ en: "Sepia", cn: "褐色" },
	{ en: "Hue", cn: "色相" },
	// ...add more as needed
];

export default function getText(lang: string, lable: string): string {
	let wording = "";

	if (lang === "CN") {
		const index = words.findIndex((item) => item.en === lable);
		wording = index === -1 ? lable : words[index].cn;
	} else {
		wording = lable;
	}
	return wording;
}
