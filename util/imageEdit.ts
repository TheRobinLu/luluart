import { IImageContext } from "@/app/interface/interface";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

function getImageType(name: string): string {
	const parts = name.split(".");
	const returnType =
		parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
	return returnType.toLowerCase();
}

export async function cropByPoints(
	image: IImageContext,
	points: { x: number; y: number }[]
): Promise<IImageContext> {
	if (!image || !image.uri) {
		throw new Error("Invalid image context provided for cropping.");
	}

	if (points.length < 4) {
		throw new Error("At least 4 points are required to define a crop area.");
	}
	const xValues = points.map((p) => p.x);
	const yValues = points.map((p) => p.y);
	const minX = Math.min(...xValues);
	const minY = Math.min(...yValues);
	const maxX = Math.max(...xValues);
	const maxY = Math.max(...yValues);
	const width = maxX - minX;
	const height = maxY - minY;

	return crop(image, minX, minY, width, height);
}

export async function crop(
	image: IImageContext,
	left: number,
	top: number,
	width: number,
	height: number
): Promise<IImageContext> {
	if (!image || !image.uri) {
		throw new Error("Invalid image context provided for cropping.");
	}
	console.log("Cropping image:", "at", left, top, "with size", width, height);

	const manipulator = ImageManipulator.manipulate(image.uri);

	manipulator.crop({
		originX: left,
		originY: top,
		width,
		height,
	});

	let newImage: any;

	const renderedImage = await manipulator.renderAsync();

	const imageType = getImageType(image.name || "");
	const saveFormat = getsaveFormat(imageType);

	newImage = await renderedImage.saveAsync({
		format: saveFormat,
		compress: 0.9,
	});

	if (newImage) {
		const retImage: IImageContext = {
			uri: newImage.uri || "",
			name: image.name,
			width: width,
			height: height,
			operations: "crop",
		};
		return retImage;
	}

	return image;
}

export async function rotate(
	image: IImageContext,
	angle: number
): Promise<IImageContext> {
	if (!image || !image.uri) {
		throw new Error("Invalid image context provided for rotation.");
	}

	console.log("Rotating image by", angle, "degrees");

	const manipulator = ImageManipulator.manipulate(image.uri);

	manipulator.rotate(angle);

	const renderedImage = await manipulator.renderAsync();

	const imageType = getImageType(image.name || "");
	const saveFormat = getsaveFormat(imageType);

	const rotatedImage = await renderedImage.saveAsync({
		format: saveFormat,
		compress: 0.9,
	});

	if (rotatedImage.uri) {
		const cropRotate = getCropAfterRotation(image.width, image.height, angle);

		let newImage = {
			uri: rotatedImage.uri,
			name: image.name,
			width: rotatedImage.width,
			height: rotatedImage.height,
		};

		const croppedImage = await crop(
			newImage,
			cropRotate.X,
			cropRotate.Y,
			cropRotate.width,
			cropRotate.height
		);

		if (croppedImage) {
			const retImage: IImageContext = {
				uri: croppedImage.uri || "",
				name: image.name,
				width: croppedImage.width,
				height: croppedImage.height,
				operations: "rotate",
			};
			return retImage;
		}

		return image;
	}
	return image;
}

function getsaveFormat(imageType: string): SaveFormat {
	switch (imageType) {
		case "png":
			return SaveFormat.PNG;
		case "webp":
			return SaveFormat.WEBP;
		case "jpg":
		case "jpeg":
			return SaveFormat.JPEG;
		default:
			return SaveFormat.JPEG; // Default to JPEG if type is unknown
	}
}

function getCropAfterRotation(
	originalWidth: number,
	originalHeight: number,
	degrees: number
): { X: number; Y: number; width: number; height: number } {
	const radians = (degrees * Math.PI) / 180;
	const newWidth =
		Math.abs(originalWidth * Math.cos(radians)) +
		Math.abs(originalHeight * Math.sin(radians));
	const newHeight =
		Math.abs(originalHeight * Math.cos(radians)) +
		Math.abs(originalWidth * Math.sin(radians));

	return {
		X: newWidth - originalWidth,
		Y: newHeight - originalHeight,
		width: originalHeight - (newWidth - originalWidth),
		height: originalHeight - (newHeight - originalHeight),
	};
}
