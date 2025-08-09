export const Version = "Version: 0.05.03";
export const ReleaseNote =
	"2025-08-09 0.05.03 remove crop after rotate\n" +
	"2025-08-09 0.05.02 if no image stack, adjust edit area width\n" +
	"2025-08-08 0.05.01 Add language selection \n" +
	"2025-08-06 0.04.08 fixed ScrollBar and edit area width and hight \n" +
	"2025-08-02 0.04.07 Adding ScrollBar for image editor \n" +
	"2025-08-02 0.04.06 fixed CropRectangle following the image zooming \n" +
	"2025-08-02 0.04.05 thiner scrollbar,add delete item btn in imgstack \n" +
	"2025-08-01 0.04.04 fix some issues, still a known issue: img not reload after apply toneAdj \n" +
	"2025-07-31 0.04.03 change LG-react to Canvas 2d, known issue: img not reload after apply or click img stake \n" +
	"2025-07-30 0.04.02 complete hue-rotate adjustments but colors are diff from saved img \n" +
	"2025-07-29 0.04.01 complete bright, contrast and saturate \n" +
	"2025-07-27 0.03.03 using expo-gl to perform bright, contrast and saturation adjustments on GUI \n" +
	"2025-07-26 0.03.02 clean up color feature on image editor area \n" +
	`2025-07-26 0.03.01 adding color adjustment tools GUI \n` +
	"2025-07-22 0.03.00 completed flip feature \n" +
	"2025-07-22 0.02.03 add saveAs image to directory \n" +
	"2025-07-21 0.02.02 change button on hover style \n" +
	"2025-07-21 0.02.01 complete rotation \n" +
	"2025-07-20 0.02.00 add rotate tool \n" +
	"2025-07-19 0.01.06 reset color \n" +
	"2025-07-19 0.01.05 set color \n" +
	"2025-07-19 0.01.04 complete cropping tool \n" +
	"2025-07-15 0.01.03 Images stack \n" +
	"2025-07-14 0.01.02 add Apply Cancel btns and version info \n" +
	"2025-07-13 0.01.01 Added Mouse position tracking \n" +
	"2025-07-13 0.01.00 Completed base UI, and Crop Tool selection \n";

export const knownIssues = [
	{
		describe: "Image not reloaded after applying tone adjustments",
		foundVer: "0.04.03",
		suggest: "Please reload the app to see the changes.",
		fixedVer: "None",
	},
	{
		describe: "Crop after rotate is not correct",
		foundVer: "0.04.04",
		suggest: "Please reload the app to see the changes.",
		fixedVer: "None",
	},
];
export const AppName = "LuluArt";
