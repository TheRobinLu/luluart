/* eslint-disable @typescript-eslint/no-unused-vars */
import { IImageContext } from "@/app/interface/interface";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Image, Platform } from "react-native";

/**
 * Browse the filesystem and pick an image file.
 * Returns the file URI and file name, or null if cancelled.
 */
export async function browseImageFile(): Promise<IImageContext | null> {
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

		let width: number | null = null;
		let height: number | null = null;
		try {
			const size = await getImageSize(result.assets[0].uri);
			width = size.width;
			height = size.height;
		} catch (e) {
			console.warn("Failed to get image size:", e);
		}

		const type = result.assets[0].mimeType || "image";
		const imageContext: IImageContext = {
			uri: result.assets[0].uri,
			name: result.assets[0].name || "",
			width: width ?? 0,
			height: height ?? 0,
		};
		console.log(
			"Selected file URI:",
			imageContext.uri,
			"\nName:",
			imageContext.name
		);

		return imageContext;
	}
	return null;
}

// Image.getSize is asynchronous, so wrap in a Promise
const getImageSize = (
	uri: string
): Promise<{ width: number; height: number }> => {
	return new Promise((resolve, reject) => {
		Image.getSize(
			uri,
			(width, height) => resolve({ width, height }),
			(error) => reject(error)
		);
	});
};

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
