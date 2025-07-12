import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

/**
 * Browse the filesystem and pick an image file.
 * Returns the file URI or null if cancelled.
 */
export async function browseImageFile(): Promise<string | null> {
	const result = await DocumentPicker.getDocumentAsync({
		type: "image/*",
		copyToCacheDirectory: true,
		multiple: false,
	});
	if (!result.canceled && result.assets && result.assets.length > 0) {
		const iniPath = FileSystem.documentDirectory + "RecentFile.ini";
		let recentFiles: string[] = [];
		try {
			const iniContent = await FileSystem.readAsStringAsync(iniPath);
			recentFiles = iniContent
				.split("\n")
				.map((line) => line.trim())
				.filter((line) => line.length > 0);
		} catch (e) {
			// File may not exist, ignore
		}
		const fileUri = result.assets[0].uri;
		if (recentFiles[recentFiles.length - 1] !== fileUri) {
			recentFiles.push(fileUri);
			if (recentFiles.length > 20) {
				recentFiles = recentFiles.slice(recentFiles.length - 20);
			}
			await FileSystem.writeAsStringAsync(iniPath, recentFiles.join("\n"));
		}
		return result.assets[0].uri;
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
	// On mobile, we can't prompt for a location, so we save to app's document directory
	const destPath = FileSystem.documentDirectory + defaultName;
	await saveImageFile(base64Image, destPath);
	return destPath;
}
