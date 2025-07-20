import { IImageContext } from "@/app/interface/interface";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

function getImageType(name: string): string {
	const parts = name.split(".");
	return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
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
	switch (imageType) {
		case "png":
			newImage = await renderedImage.saveAsync({
				format: SaveFormat.PNG,
			});
			break;
		case "webp":
			newImage = await renderedImage.saveAsync({
				format: SaveFormat.WEBP,
			});
			break;
		case "jpg":
		case "jpeg":
			newImage = await renderedImage.saveAsync({
				format: SaveFormat.JPEG,
				compress: 0.9, // Adjust quality as needed
			});
			break;

		default:
			newImage = await renderedImage.saveAsync({
				format: SaveFormat.WEBP,
			});
			break;
	}

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

	let newImage: any;

	const imageType = getImageType(image.name || "");
	switch (imageType) {
		case "png":
			newImage = await renderedImage.saveAsync({
				format: SaveFormat.PNG,
			});
			break;
		case "webp":
			newImage = await renderedImage.saveAsync({
				format: SaveFormat.WEBP,
			});
			break;
		case "jpg":
		case "jpeg":
			newImage = await renderedImage.saveAsync({
				format: SaveFormat.JPEG,
				compress: 0.9, // Adjust quality as needed
			});
			break;

		default:
			newImage = await renderedImage.saveAsync({
				format: SaveFormat.WEBP,
			});
			break;
	}

	if (newImage) {
		const retImage: IImageContext = {
			uri: newImage.uri || "",
			name: image.name,
			width: image.width,
			height: image.height,
			operations: "rotate",
		};
		return retImage;
	}

	return image;
}
