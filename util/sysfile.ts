/* eslint-disable @typescript-eslint/no-unused-vars */
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

/**
 * Browse the filesystem and pick an image file.
 * Returns the file URI and file name, or null if cancelled.
 */
export async function browseImageFile(): Promise<{
	uri: string;
	name: string;
} | null> {
	const result = await DocumentPicker.getDocumentAsync({
		type: "image/*",
		copyToCacheDirectory: true,
		multiple: false,
	});
	if (!result.canceled && result.assets && result.assets.length > 0) {
		let recentFiles: string[] = [];
		if (Platform.OS === "web") {
			const iniContent = localStorage.getItem("RecentFile") || "";
			recentFiles = iniContent
				.split("\n")
				.map((line) => line.trim())
				.filter((line) => line.length > 0);
		} else {
			const iniPath = FileSystem.documentDirectory + "RecentFile";
			try {
				const iniContent = await FileSystem.readAsStringAsync(iniPath);
				recentFiles = iniContent
					.split("\n")
					.map((line) => line.trim())
					.filter((line) => line.length > 0);
			} catch (e) {
				// File may not exist, ignore
			}
		}
		const fileUri = result.assets[0].uri;
		const fileName = result.assets[0].name || "";
		console.log("Selected file URI:", fileUri, "Name:", fileName);
		// Add to recent files if not already present

		return { uri: fileUri, name: fileName };
	}
	return null;
}

/**
 * Open an image file and read its contents as a base64 string.
 * @param uri File URI
 */
export async function openImageFile(uri: string): Promise<string> {
	return await FileSystem.readAsStringAsync(uri, {
		encoding: FileSystem.EncodingType.Base64,
	});
}

/**
 * Save an image file to a given path.
 * @param base64Image Base64 string of the image
 * @param destPath Destination file path (including filename)
 */
export async function saveImageFile(
	base64Image: string,
	destPath: string
): Promise<void> {
	if (Platform.OS === "web") {
		// On web, trigger a download
		const link = document.createElement("a");
		link.href = "data:image/jpeg;base64," + base64Image;
		link.download = destPath.split("/").pop() || "image.jpg";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		return;
	}
	await FileSystem.writeAsStringAsync(destPath, base64Image, {
		encoding: FileSystem.EncodingType.Base64,
	});
}

/**
 * Save As: Prompt user for a location and save the image file.
 * Returns the new file URI or null if cancelled.
 */
export async function saveAsImageFile(
	base64Image: string,
	defaultName = "image.jpg"
): Promise<string | null> {
	if (Platform.OS === "web") {
		// On web, trigger a download
		const link = document.createElement("a");
		link.href = "data:image/jpeg;base64," + base64Image;
		link.download = defaultName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		return null;
	}
	// On mobile, we can't prompt for a location, so we save to app's document directory
	const destPath = FileSystem.documentDirectory + defaultName;
	await saveImageFile(base64Image, destPath);
	return destPath;
}
