/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
//import { crop } from "@/util/imageEdit";
import { IImageContext } from "@/app/interface/interface";
import { cropByPoints, flipH, flipV, rotate, toneAdj } from "@/util/imageEdit";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { baseColors, currTheme } from "../../constants/Colors";
import { Version } from "../../constants/const";
import getText from "../../constants/dictionary";
import {
	fetchLanguage,
	getSysLanguage,
	storeLanguage,
} from "../../util/language";
import { browseImageFile } from "../../util/sysfile"; // adjust path if needed

declare global {
	interface Window {
		showDirectoryPicker?: () => Promise<any>;
	}
}

export default function DarkroomScreen() {
	//const [hovered, setHovered] = useState<string | null>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const imgRef = useRef<HTMLImageElement>(null);
	const fileIcons = [
		{ key: "open", icon: "folder-open-outline", label: "Open" },
		{ key: "save", icon: "save-outline", label: "Save" },
	];

	const toolIcons = [
		{ key: "crop", icon: "crop-outline", label: "Crop" },
		{ key: "rotate", icon: "sync-outline", label: "Rotate" },
		//{ key: "brightness", icon: "sunny-outline", label: "Brightness" },
		{ key: "flip", icon: "grid-outline", label: "Flip" },
		{ key: "tone", icon: "color-palette-sharp", label: "Tone" },
		//{ key: "contrast", icon: "contrast-outline", label: "Contrast" },
	];

	const ICON_SIZE = 42;
	const ICON_MARGIN = 6;
	const MIN_ICONS = 3;
	const MAX_ICONS = 6;

	// Calculate width for exactly 6 tool icons
	const toolboxWidth = ICON_SIZE * 6 + ICON_MARGIN * 5 + 24; // 6 icons, 5 margins, 24px padding

	const [editImage, setEditImage] = useState<IImageContext | null>(null);

	const [zoom, setZoom] = useState(1);
	const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
		null
	);

	const [flippedHorizontally, setFlippedHorizontally] = useState(false);
	const [flippedVertically, setFlippedVertically] = useState(false);

	const [imageStack, setImageStack] = useState<IImageContext[]>([]);

	const [modified, setModified] = useState(false); // Track if image has been modified
	// Track if image has been modified, used for save confirmation
	const [selectedTool, setSelectedTool] = useState<string | null>(null);
	const [cropRect, setCropRect] = useState<{
		start: { x: number; y: number } | null;
		end: { x: number; y: number } | null;
	} | null>(null);
	const [isCropping, setIsCropping] = useState(false);
	const [rotationAngle, setRotationAngle] = useState(0);

	// Add state for color adjustments
	const [brightnessValue, setBrightnessValue] = useState(1);
	const [contrastValue, setContrastValue] = useState(1);
	const [saturateValue, setSaturateValue] = useState(1);
	const [sepiaValue, setSepiaValue] = useState(0);
	const [hueValue, setHueValue] = useState(0);
	const [editAreaWidth, setEditAreaWidth] = useState(1200);
	const [editAreaHeight, setEditAreaHeight] = useState(1200);

	const [imagePosition, setImagePosition] = useState({
		x: 0,
		y: 0,
		width: 0,
		height: 0,
	});

	// Language state
	const [lang, setLang] = useState<string>(
		() => fetchLanguage() || getSysLanguage()
	);

	//when resize browser window, get width and height of the window
	useEffect(() => {
		const handleResize = () => {
			const width = window.innerWidth;
			const height = window.innerHeight;
			const hasImageStack = imageStack.length > 0;
			setEditAreaWidth(width - toolboxWidth - (hasImageStack ? 100 : 0));
			setEditAreaHeight(height - 40);
			console.log("Window resized:", width, height);
		};

		window.addEventListener("resize", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, [imageStack.length]); // recalc when imageStack appears/disappears

	// Draw image to canvas whenever image/filter/zoom changes
	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		const img = imgRef.current;
		if (!canvas || !ctx || !img || !editImage?.uri) return;

		// Set canvas size to match zoomed image
		const width = editImage.width ? editImage.width * zoom : 300 * zoom;
		const height = editImage.height ? editImage.height * zoom : 300 * zoom;
		canvas.width = width;
		canvas.height = height;

		// Only draw if image is loaded
		if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
			ctx.clearRect(0, 0, width, height);
			ctx.save();

			// Apply flip and rotation transforms
			ctx.translate(width / 2, height / 2);
			if (selectedTool === "rotate" && rotationAngle) {
				ctx.rotate((rotationAngle * Math.PI) / 180);
			}
			ctx.scale(flippedHorizontally ? -1 : 1, flippedVertically ? -1 : 1);

			// Apply filter
			ctx.filter = `
				brightness(${brightnessValue})
				contrast(${contrastValue})
				saturate(${saturateValue})
				hue-rotate(${hueValue}deg) 
				sepia(${sepiaValue})
			`.replace(/\s+/g, " ");

			// Draw image centered
			ctx.drawImage(
				img,
				(-editImage.width * zoom) / 2,
				(-editImage.height * zoom) / 2,
				editImage.width * zoom,
				editImage.height * zoom
			);

			ctx.restore();
		}
	}, [
		editImage,
		brightnessValue,
		contrastValue,
		saturateValue,
		sepiaValue,
		hueValue,
		flippedHorizontally,
		flippedVertically,
		selectedTool,
		rotationAngle,
	]);

	const handleImgLoad = () => {
		// Just trigger the effect above
	};

	// Add this function to track cursor position during all mouse/touch movements
	const handleMouseMove = (event: any) => {
		const { locationX, locationY } = event.nativeEvent;
		// Always update cursor position regardless of image bounds
		// Ensure x and y are never negative
		setCursorPos({
			x: Math.max(0, Math.round(locationX)),
			y: Math.max(0, Math.round(locationY)),
		});
	};

	const handleOpenFile = async () => {
		const result: IImageContext | null = await browseImageFile();
		if (result) {
			setEditImage(result);

			const stack = { ...result, operations: "original" };
			resetImageStack();
			setImageStack((prev) => [...prev, stack]);
		}
	};

	const handleSaveAs = async () => {
		if (!editImage?.uri) return;
		const dirHandle = await (window as any).showDirectoryPicker();

		console.log("Saving image to directory:", dirHandle);

		if (!dirHandle) {
			alert("Directory selection not supported in this environment.");
			return;
		}

		const defaultName = editImage.name || "edited_image";
		const fileHandle = await dirHandle.getFileHandle(defaultName, {
			create: true,
		});
		const writableStream = await fileHandle.createWritable();
		const base64Image = await fetch(editImage.uri).then((response) =>
			response.blob().then((blob) => {
				return new Promise<string>((resolve, reject) => {
					const reader = new FileReader();
					reader.onloadend = () => {
						const base64 = (reader.result as string).split(",")[1];
						resolve(base64);
					};
					reader.onerror = reject;
					reader.readAsDataURL(blob);
				});
			})
		);

		await writableStream.write(
			Uint8Array.from(atob(base64Image), (c) => c.charCodeAt(0))
		);
		await writableStream.close();
		alert(`Image saved as ${defaultName} in selected directory.`);
	};

	const handleImageTouchStart = (event: any) => {
		if (selectedTool !== "crop") return;
		const { locationX, locationY } = event.nativeEvent;
		// Convert to image/canvas coordinates
		const x = Math.max(0, Math.round(locationX) / zoom);
		const y = Math.max(0, Math.round(locationY) / zoom);
		setCropRect({
			start: { x, y },
			end: null,
		});
		setIsCropping(true);
	};
	const handleImageTouchMove = (event: any) => {
		if (selectedTool !== "crop" || !isCropping || !cropRect?.start) return;
		const { locationX, locationY } = event.nativeEvent;
		// Convert to image/canvas coordinates
		const x = Math.max(0, Math.round(locationX) / zoom);
		const y = Math.max(0, Math.round(locationY) / zoom);
		setCropRect((prev) =>
			prev
				? {
						...prev,
						end: {
							x: Math.max(
								0,
								Math.min(
									x,
									editImage?.width !== undefined
										? editImage.width * zoom
										: 300 * zoom
								)
							),
							y: Math.max(
								0,
								Math.min(
									y,
									editImage?.height !== undefined
										? editImage.height * zoom
										: 300 * zoom
								)
							),
						},
					}
				: prev
		);
	};
	const handleImageTouchEnd = (event: any) => {
		const { locationX, locationY } = event.nativeEvent;
		const x = Math.max(0, Math.round(locationX) / zoom);
		const y = Math.max(0, Math.round(locationY) / zoom);
		setCursorPos({ x, y });

		if (selectedTool !== "crop" || !isCropping || !cropRect?.start) return;
		setCropRect((prev) =>
			prev
				? {
						...prev,
						end: {
							x: Math.max(
								0,
								Math.min(
									x,
									editImage && typeof editImage.width === "number"
										? editImage.width * zoom
										: 300 * zoom
								)
							),
							y: Math.max(
								0,
								Math.min(
									y,
									editImage && typeof editImage.height === "number"
										? editImage.height * zoom
										: 300 * zoom
								)
							),
						},
					}
				: prev
		);
		setIsCropping(false);
		setModified(true);
	};

	const handleApply = async () => {
		let result: IImageContext | null = null;

		switch (selectedTool) {
			case "crop":
				result = (await applyCrop()) ?? null;
				break;
			case "rotate":
				result = (await applyRotate()) ?? null;
				break;
			case "flip":
				if (!editImage) break;
				let flippedImage = editImage;
				if (flippedHorizontally) {
					flippedImage = await flipH(flippedImage);
				}
				if (flippedVertically) {
					flippedImage = await flipV(flippedImage);
				}
				result = flippedImage;
				// Reset flip state after apply
				setFlippedHorizontally(false);
				setFlippedVertically(false);
				break;
			case "tone":
				result = (await applyToneAdj()) ?? null;
				break;
			default:
				break;
		}
		console.log(selectedTool, " result:", result?.name, result?.uri);
		if (result) {
			setEditImage(result);
			// Add to image stack with operation
			const stack = { ...result, operations: selectedTool || "modified" };
			setImageStack((prev) => [...prev, stack]);
			// Only reset filter states after image is set
		}

		setModified(false); // Mark as unmodified after applying changes
	};

	const handleCancel = () => {
		setModified(false); // Mark as unmodified after canceling changes
	};

	const handleFlip = (direction: "horizontal" | "vertical") => {
		if (direction === "horizontal") {
			setFlippedHorizontally((prev) => !prev);
		} else {
			setFlippedVertically((prev) => !prev);
		}
	};

	const applyCrop = async () => {
		if (!cropRect?.start || !cropRect?.end || !editImage) return;
		console.log("Applying crop with rect:", cropRect);
		const result = await cropByPoints(editImage, [
			cropRect.start,
			{ x: cropRect.end.x, y: cropRect.start.y },
			cropRect.end,
			{ x: cropRect.start.x, y: cropRect.end.y },
		]);

		setCropRect({
			start: null,
			end: null,
		});

		if (result.uri) {
			return result;
		} else return null as IImageContext | null;
	};

	const applyRotate = async () => {
		if (!editImage) return;
		const result = await rotate(editImage, rotationAngle);
		if (result) {
			setRotationAngle(0);
			return result;
		}

		return editImage; // Return original image if rotation fails
	};

	const applyToneAdj = async () => {
		if (!editImage) return;
		const result = await toneAdj(
			editImage,
			brightnessValue,
			contrastValue,
			saturateValue,
			sepiaValue,
			hueValue
		);

		if (result) {
			setBrightnessValue(1);
			setContrastValue(1);
			setSaturateValue(1);
			setSepiaValue(0);
			setHueValue(0);
			return result;
		}

		return editImage;
	};

	const onImageLayout = (event: any) => {
		const { x, y, width, height } = event.nativeEvent.layout;
		setImagePosition({ x, y, width, height });
	};

	const selectTool = (tool: string) => {
		// Reset flip state when switching away from flip tool
		if (tool !== "flip") {
			setFlippedHorizontally(false);
			setFlippedVertically(false);
		}
		switch (tool) {
			case "crop":
				// Handle crop tool selection
				break;
			case "rotate":
				setRotationAngle(0);
				// Handle rotate tool selection
				break;
			case "resize":
				// Handle resize tool selection
				break;
			case "tone":

			default:
				break;
		}
		setSelectedTool(tool);
	};

	const horizontalGridLines = () => {
		const lines = [];
		for (let i = 1; i < 10; i++) {
			lines.push(
				<View
					key={`hgrid-${i}`}
					style={[viewStyles.gridLineH, { top: `${i * 10}%` }]}
				/>
			);
		}
		return lines;
	};

	const verticalGridLines = () => {
		const lines = [];
		for (let i = 1; i < 10; i++) {
			lines.push(
				<View
					key={`vgrid-${i}`}
					style={[viewStyles.gridLineV, { left: `${i * 10}%` }]}
				/>
			);
		}
		return lines;
	};

	const resetImageStack = () => {
		setImageStack([]);
	};

	const handleDeleteStackItem = (index: number) => {
		setImageStack((prev) => prev.filter((_, i) => i !== index));
	};

	const handleLangChange = (newLang: string) => {
		setLang(newLang);
		storeLanguage(newLang);
	};

	return (
		<View style={viewStyles.container}>
			{/* Image stack thumbnails - now on the left side */}
			{imageStack.length > 0 && (
				<View id="image-stack" style={viewStyles.imageStackContainer}>
					<Text style={textStyles.stackHeader}>{getText(lang, "History")}</Text>
					<ScrollView
						style={viewStyles.imageStackScroll}
						contentContainerStyle={viewStyles.imageStackScrollContent}
						showsVerticalScrollIndicator={true}
						indicatorStyle="black" // dark style for iOS
						//scrollbarSize={8} // thinner scrollbar
					>
						{imageStack.map((item, index) => (
							<Pressable
								key={index}
								style={[
									viewStyles.imageStackItem,
									editImage?.uri === item.uri && viewStyles.selectedStackItem,
								]}
								onPress={() => {
									if (item.uri) {
										Image.getSize(item.uri, (width, height) => {
											setEditImage({
												uri: item.uri,
												width,
												height,
												name: editImage?.name || "",
											});
										});
									}
								}}
							>
								<Image
									source={{ uri: item.uri ?? "" }}
									style={imageStyles.imageStackThumb}
									resizeMode="contain"
								/>
								<View
									style={{
										flexDirection: "row",
										//alignItems: "center",
										//justifyContent: "space-between",
										width: "100%",
									}}
								>
									<Text
										id="image-stack-operation"
										style={[
											textStyles.imageStackOperation,
											{ alignItems: "flex-start" },
										]}
									>
										{getText(lang, item.operations || "")}
									</Text>
									<View style={{ flex: 1 }} />
									<Pressable
										id="delete-stack-item"
										onPress={() => handleDeleteStackItem(index)}
										style={{
											marginLeft: 4,
											paddingHorizontal: 6,
											paddingVertical: 2,
											borderRadius: 4,
											alignItems: "flex-end",
										}}
									>
										<Text style={{ color: currTheme.text, fontWeight: "bold" }}>
											X
										</Text>
									</Pressable>
								</View>
							</Pressable>
						))}
					</ScrollView>
				</View>
			)}

			{/* Horizontal scroll bar at the top */}
			<View
				style={{
					width: editAreaWidth,
					height: editAreaHeight,
				}}
			>
				<ScrollView
					style={[{ flex: 1 }, { marginBottom: 40 }]}
					contentContainerStyle={{
						flexGrow: 1,
						//minWidth: editAreaWidth,
						minHeight: editAreaHeight * zoom,
					}}
					showsVerticalScrollIndicator={true}
				>
					<ScrollView
						contentContainerStyle={{
							flexGrow: 1,
							minWidth: editAreaWidth * zoom,
						}}
						horizontal={true}
						showsHorizontalScrollIndicator={true}
					>
						<View id="edit-area" style={viewStyles.editArea}>
							<View style={viewStyles.editAreaContent}>
								<View id="image-container" style={viewStyles.imageContainer}>
									<View
										id="inner-image-container"
										style={[
											viewStyles.innerImageContainer,
											{
												width: editImage
													? editImage.width
														? editImage.width * zoom
														: 300 * zoom
													: 300 * zoom,
												height: editImage
													? editImage.height
														? editImage.height * zoom
														: 300 * zoom
													: 300 * zoom,
												transform: [
													{
														translateX: editImage
															? editImage.width
																? -(editImage.width * zoom) / 2
																: -150 * zoom
															: -150 * zoom,
													},
													{
														translateY: editImage
															? editImage.height
																? -(editImage.height * zoom) / 2
																: -150 * zoom
															: -150 * zoom,
													},
												],
											},
										]}
										onStartShouldSetResponder={() => true}
										onResponderGrant={handleImageTouchStart}
										onResponderMove={(event) => {
											//handleMouseMove(event);
											handleImageTouchMove(event);
										}}
										onResponderRelease={handleImageTouchEnd}
									>
										{/* Canvas 2D rendering */}
										<View
											style={{
												width: "100%",
												height: "100%",
												overflow: "hidden",
												justifyContent: "center",
												alignItems: "center",
											}}
										>
											<img
												ref={imgRef}
												src={editImage?.uri ?? ""}
												style={{
													display: "none",
												}}
												width={editImage?.width ?? 300}
												height={editImage?.height ?? 300}
												onLoad={handleImgLoad}
												alt=""
											/>
											<canvas
												ref={canvasRef}
												style={{
													width: editImage?.width
														? editImage.width * zoom
														: 300 * zoom,
													height: editImage?.height
														? editImage.height * zoom
														: 300 * zoom,
													backgroundColor: currTheme.background,
													borderRadius: 4,
												}}
											/>
										</View>

										{selectedTool === "rotate" && (
											<View
												id="rotation-overlay"
												pointerEvents="none"
												style={[
													viewStyles.gridOverlay,
													{
														width: editImage
															? editImage.width * zoom
															: 300 * zoom,
														height: editImage
															? editImage.height * zoom
															: 300 * zoom,
													},
												]}
											>
												{/* 2 vertical and 2 horizontal lines for 3x3 grid */}
												{horizontalGridLines()}
												{/* Vertical lines */}
												{verticalGridLines()}
											</View>
										)}
										{/* Crop rectangle overlay */}
										{selectedTool === "crop" &&
											cropRect?.start &&
											cropRect?.end && (
												<View
													id="crop-rectangle-overlay"
													style={[
														viewStyles.cropRectangle,
														{
															left:
																Math.min(cropRect.start.x, cropRect.end.x) *
																zoom,
															top:
																Math.min(cropRect.start.y, cropRect.end.y) *
																zoom,
															width:
																Math.abs(cropRect.end.x - cropRect.start.x) *
																zoom,
															height:
																Math.abs(cropRect.end.y - cropRect.start.y) *
																zoom,
															// left: Math.min(cropRect.start.x, cropRect.end.x),
															// top: Math.min(cropRect.start.y, cropRect.end.y),
															// width: Math.abs(cropRect.end.x - cropRect.start.x),
															// height: Math.abs(cropRect.end.y - cropRect.start.y),
														},
													]}
													pointerEvents="none"
												/>
											)}
									</View>
								</View>
								{/* Status bar moved to absolute bottom */}
							</View>

							{/* Apply/Cancel buttons */}
						</View>
					</ScrollView>
				</ScrollView>
				<View id="status-bar" style={viewStyles.statusBar}>
					{/* Consolidated status bar with all info in one row */}
					<View style={viewStyles.statusRowContainer}>
						<Text style={textStyles.statusValue}>
							{cursorPos
								? `X: ${Math.round(cursorPos.x)}   Y: ${Math.round(cursorPos.y)}`
								: "X: 0 Y: 0"}
						</Text>

						<View style={viewStyles.zoomBarContainer}>
							<View style={{ flexDirection: "row", alignItems: "center" }}>
								<Text style={textStyles.statusText}>
									{getText(lang, "Zoom")}:{" "}
								</Text>
								<Text style={textStyles.zoomValue}>
									{(zoom * 100).toFixed(0)}%
								</Text>
							</View>
							<Slider
								style={viewStyles.slider}
								minimumValue={0.05}
								maximumValue={3}
								step={0.1}
								value={zoom}
								onValueChange={setZoom}
								minimumTrackTintColor={currTheme.minSlider}
								maximumTrackTintColor={currTheme.maxSlider}
								thumbTintColor={currTheme.tint}
							/>
							<Text style={textStyles.zoomValue}>{zoom.toFixed(1)}x</Text>
						</View>

						<Text style={textStyles.statusText}>
							{editImage
								? editImage.name
									? `${getText(lang, "File: ")}${editImage.name}`
									: getText(lang, "No file loaded")
								: getText(lang, "No file loaded")}
						</Text>
					</View>
				</View>
			</View>
			<View
				id="toolboxes"
				style={[viewStyles.toolbox, { width: toolboxWidth }]}
			>
				{/* Add logo at the top of toolbox */}
				<View style={viewStyles.logoContainer}>
					<Image
						id="logo"
						source={require("../../assets/images/LuluArt.jpg")}
						style={imageStyles.logoImage}
						resizeMode="contain"
					/>
					<View style={{ flexDirection: "row", alignItems: "center" }}>
						<Text style={textStyles.versionText}>{Version}</Text>
						{/* Language buttons */}
						<Pressable
							onPress={() => handleLangChange("EN")}
							style={{
								marginLeft: 8,
								paddingHorizontal: 8,
							}}
						>
							<Text
								style={{
									color:
										lang === "EN" ? currTheme.text : currTheme.btnfaceSelected,
									fontSize: 10,
									fontWeight: lang === "EN" ? "bold" : "normal",
								}}
							>
								EN
							</Text>
						</Pressable>
						<Pressable
							onPress={() => handleLangChange("CN")}
							style={{
								marginLeft: 4,
								paddingHorizontal: 8,
							}}
						>
							<Text
								style={{
									color:
										lang === "CN" ? currTheme.text : currTheme.btnfaceSelected,
									fontSize: 10,
									fontWeight: lang === "CN" ? "bold" : "normal",
								}}
							>
								中文
							</Text>
						</Pressable>
					</View>
				</View>

				<View id="file-box" style={viewStyles.fileBox}>
					<Text style={textStyles.toolboxTitle}>{getText(lang, "File")}</Text>
					<View style={viewStyles.iconRow}>
						{fileIcons.map((item) => (
							<Pressable
								key={item.key}
								style={[viewStyles.iconButton, viewStyles.unselectedTool]}
								onPress={
									item.key === "open"
										? handleOpenFile
										: item.key === "save"
											? handleSaveAs
											: undefined
								}
							>
								{({ hovered }) => (
									<>
										<Ionicons
											name={item.icon}
											size={28}
											style={{
												color: currTheme.btntext,
											}}
										/>
										{hovered && (
											<Text
												style={[
													textStyles.iconLabel,
													{ color: currTheme.btntext },
												]}
											>
												{getText(lang, item.label)}
											</Text>
										)}
									</>
								)}
							</Pressable>
						))}
					</View>
				</View>
				<Text style={textStyles.toolboxTitle}>{getText(lang, "Toolbox")}</Text>
				<View id="toolbox" style={viewStyles.iconRow}>
					{toolIcons.map((item) => {
						const isSelected = selectedTool === item.key;
						return (
							<Pressable
								key={item.key}
								style={({ hovered }) => [
									viewStyles.iconButton,
									isSelected
										? viewStyles.selectedTool
										: viewStyles.unselectedTool,
									hovered && viewStyles.iconButtonHovered,
								]}
								onPress={() => selectTool(item.key)}
							>
								{({ hovered }) => (
									<>
										<Ionicons
											name={item.icon}
											size={28}
											style={{
												color: isSelected
													? currTheme.btntextSelected
													: currTheme.btntext,
											}}
										/>
										{hovered && (
											<Text
												style={[
													textStyles.iconLabel,
													isSelected
														? textStyles.selectedToolText
														: textStyles.unselectedToolText,
												]}
											>
												{getText(lang, item.label)}
											</Text>
										)}
									</>
								)}
							</Pressable>
						);
					})}
				</View>

				{/* Add a spacer that pushes content to the top and buttons to the bottom */}
				<View style={viewStyles.spacer}></View>

				{/* Flip buttons: only show when tool = flip */}
				{selectedTool === "flip" && (
					<View style={viewStyles.flipButtonContainer}>
						<Pressable
							style={({ hovered }) => [
								viewStyles.iconButton,
								hovered && viewStyles.iconButtonHovered,
							]}
							onPress={() => handleFlip("horizontal")}
						>
							<MaterialCommunityIcons
								name="flip-horizontal"
								size={28}
								color={currTheme.btntext}
							/>
						</Pressable>
						<Pressable
							style={({ hovered }) => [
								viewStyles.iconButton,
								hovered && viewStyles.iconButtonHovered,
							]}
							onPress={() => handleFlip("vertical")}
						>
							<MaterialCommunityIcons
								name="flip-vertical"
								size={28}
								color={currTheme.btntext}
							/>
						</Pressable>
					</View>
				)}

				{/* Rotate slider control: only show when tool = rotate */}
				{selectedTool === "rotate" && (
					<View style={viewStyles.rotateSliderContainer}>
						<View style={viewStyles.rotateIconContainer}>
							<Ionicons
								name="sync-outline"
								size={24}
								style={{
									color: currTheme.btntext,
								}}
							/>
						</View>
						<View style={viewStyles.rotateSliderWrapper}>
							<Slider
								style={viewStyles.rotateSlider}
								minimumValue={-180}
								maximumValue={180}
								step={1}
								value={rotationAngle}
								onValueChange={setRotationAngle}
								minimumTrackTintColor={currTheme.minSlider}
								maximumTrackTintColor={currTheme.maxSlider}
								thumbTintColor={currTheme.tint}
							/>
							<Text style={textStyles.rotateValue}>{rotationAngle}°</Text>
						</View>
					</View>
				)}

				{/* Color sliders: only show when tool = color */}
				{selectedTool === "tone" && (
					<View style={viewStyles.colorSlidersContainer}>
						<View style={viewStyles.colorSliderRow}>
							<Ionicons
								name="sunny-outline"
								size={22}
								color={currTheme.btntext}
								style={viewStyles.colorSliderIcon}
							/>
							<Slider
								style={viewStyles.colorSlider}
								minimumValue={0}
								maximumValue={2}
								step={0.01}
								value={brightnessValue}
								onValueChange={setBrightnessValue}
								minimumTrackTintColor={currTheme.minSlider}
								maximumTrackTintColor={currTheme.maxSlider}
								thumbTintColor={currTheme.tint}
							/>
							<Text style={textStyles.colorSliderValue}>
								{brightnessValue.toFixed(2)}
							</Text>
						</View>
						<View style={viewStyles.colorSliderRow}>
							<Ionicons
								name="contrast-outline"
								size={22}
								color={currTheme.btntext}
								style={viewStyles.colorSliderIcon}
							/>
							<Slider
								style={viewStyles.colorSlider}
								minimumValue={0}
								maximumValue={2}
								step={0.01}
								value={contrastValue}
								onValueChange={setContrastValue}
								minimumTrackTintColor={currTheme.minSlider}
								maximumTrackTintColor={currTheme.maxSlider}
								thumbTintColor={currTheme.tint}
							/>
							<Text style={textStyles.colorSliderValue}>
								{contrastValue.toFixed(2)}
							</Text>
						</View>
						<View style={viewStyles.colorSliderRow}>
							<Ionicons
								name="color-palette-outline"
								size={22}
								color={currTheme.btntext}
								style={viewStyles.colorSliderIcon}
							/>
							<Slider
								style={viewStyles.colorSlider}
								minimumValue={0}
								maximumValue={2}
								step={0.01}
								value={saturateValue}
								onValueChange={setSaturateValue}
								minimumTrackTintColor={currTheme.minSlider}
								maximumTrackTintColor={currTheme.maxSlider}
								thumbTintColor={currTheme.tint}
							/>
							<Text style={textStyles.colorSliderValue}>
								{saturateValue.toFixed(2)}
							</Text>
						</View>
						{/* New Sepia slider */}
						<View style={viewStyles.colorSliderRow}>
							<Ionicons
								name="color-filter-outline"
								size={22}
								color={currTheme.btntext}
								style={viewStyles.colorSliderIcon}
							/>
							<Slider
								style={viewStyles.colorSlider}
								minimumValue={0}
								maximumValue={1}
								step={0.01}
								value={sepiaValue}
								onValueChange={setSepiaValue}
								minimumTrackTintColor={baseColors.orange_400}
								maximumTrackTintColor={baseColors.blue_300}
								thumbTintColor={currTheme.tint}
							/>
							<Text style={textStyles.colorSliderValue}>
								{sepiaValue.toFixed(2)}
							</Text>
						</View>
						{/* Hue slider with color spectrum */}
						<View style={[viewStyles.colorSliderRow, { padding: 2 }]}>
							<Image
								source={require("../../assets/images/hue_wheel.png")}
								style={[viewStyles.colorSliderIcon, { width: 26, height: 26 }]}
							/>
							<View style={viewStyles.hueSliderContainer}>
								<LinearGradient
									colors={[
										baseColors.red_500,
										baseColors.orange_400,
										baseColors.yellow_400,
										baseColors.green_500,
										baseColors.blue_500,
										baseColors.purple_700,
										baseColors.violet_600,
										baseColors.red_500,
									]}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 0 }}
									style={viewStyles.hueGradient}
								/>
								<Slider
									style={viewStyles.hueSlider}
									minimumValue={-180}
									maximumValue={180}
									step={1}
									value={hueValue}
									onValueChange={setHueValue}
									minimumTrackTintColor="transparent"
									maximumTrackTintColor="transparent"
									thumbTintColor={currTheme.tint}
								/>
							</View>
							<Text style={textStyles.colorSliderValue}>
								{hueValue.toFixed(0)}°
							</Text>
						</View>
					</View>
				)}

				{/* Action buttons at the bottom */}
				<View style={viewStyles.actionButtonContainer}>
					<Pressable
						style={({ hovered }) => [
							viewStyles.button,
							hovered && viewStyles.iconButtonHovered,
						]}
						onPress={() => {
							handleApply();
						}}
					>
						<Text style={textStyles.buttonText}>{getText(lang, "Apply")}</Text>
					</Pressable>
					<Pressable
						style={({ hovered }) => [
							viewStyles.button,
							hovered && viewStyles.iconButtonHovered,
						]}
						onPress={() => {
							handleCancel();
						}}
					>
						<Text style={textStyles.buttonText}>{getText(lang, "Cancel")}</Text>
					</Pressable>
				</View>
			</View>
		</View>
	);
}

// Constants for styling
const ICON_SIZE = 42;
const ICON_MARGIN = 6;
const MIN_ICONS = 3;
const MAX_ICONS = 6;

// All styles moved to the end of the file
// Separate styles for View, Text, and Image components to avoid type conflicts
const viewStyles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: "row",
		backgroundColor: currTheme.background,
	},
	toolbox: {
		backgroundColor: currTheme.panel,
		padding: 8,
		justifyContent: "flex-start",
		zIndex: 2,
	},
	fileBox: {
		marginBottom: 18,
	},
	iconRow: {
		flexDirection: "row",
		flexWrap: "nowrap",
		marginBottom: 8,
	},
	iconButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: currTheme.btnface,
		color: currTheme.btntext,
		padding: 6,
		marginRight: ICON_MARGIN,
		borderRadius: 6,
		maxHeight: ICON_SIZE,
		maxWidth: ICON_SIZE,
		justifyContent: "center",
		// Merge hovered style
		borderWidth: 1,
		borderColor: currTheme.btnfaceSelected,
		borderStyle: "solid",
	},

	iconButtonHovered: {
		backgroundColor: currTheme.btnfaceHover,
		// You can add more hover-specific styles here
	},

	selectedTool: {
		backgroundColor: currTheme.btnfaceSelected,
	},
	unselectedTool: {
		backgroundColor: currTheme.btnface,
	},
	toolboxTitle: {
		marginBottom: 16,
	},
	editArea: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: currTheme.background,
		position: "relative",
		zIndex: 1,
	},
	editAreaContent: {
		flex: 1,
		width: "100%",
	},
	imageContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	innerImageContainer: {
		justifyContent: "center",
		alignItems: "center",
		position: "absolute",
		top: "50%",
		left: "50%",
	},
	cropRectangle: {
		position: "absolute",
		borderWidth: 2,
		borderColor: currTheme.btntext,
		borderStyle: "dashed",
		zIndex: 10,
	},
	statusBar: {
		position: "absolute",
		margin: 8,
		bottom: 0,
		backgroundColor: "rgba(0,0,0,0.3)",
		left: 0,
		right: 0,
		width: "100%",
		paddingVertical: 4,
		paddingHorizontal: 8,
	},
	statusRowContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		width: "100%",
	},
	statusItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: 2,
		flex: 0, // Don't let items take more space than needed
	},
	statusDivider: {
		width: 1,
		height: 24,
		backgroundColor: currTheme.btntext,
		marginHorizontal: 8,
	},
	// This item should have flex to take available space
	zoomBarContainer: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
		maxWidth: 90, // Limit maximum width
	},
	slider: {
		width: 120, // Fixed width for better control
		height: 20,
		marginHorizontal: 8,
	},
	spacer: {
		flex: 1,
	},
	actionButtonContainer: {
		flexDirection: "row",
		marginTop: 8,
		marginBottom: 0,
		width: "100%",
		justifyContent: "space-between",
	},
	button: {
		backgroundColor: currTheme.btnface,
		color: currTheme.btntext,
		fontFamily: "Arial",
		fontWeight: "bold",
		borderRadius: 6,
		paddingVertical: 10,
		alignItems: "center",
		width: "48%",
	},
	logoContainer: {
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
		paddingBottom: 8,
		borderBottomWidth: 1,
		borderBottomColor: currTheme.btnface,
	},
	imageStackContainer: {
		width: 100,
		backgroundColor: currTheme.panel,
		flexDirection: "column",
		padding: 4,
		paddingRight: 1,
		position: "relative",
		height: "100%",
		borderLeftWidth: 1,
		borderLeftColor: currTheme.btnface,
		zIndex: 2,
		// Custom scrollbar for Android (Web-like effect)
	},
	imageStackScroll: {
		flex: 1,
	},
	imageStackScrollContent: {
		paddingBottom: 10,
	},
	imageStackItem: {
		width: 84,
		height: 100,
		marginBottom: 4,
		marginRight: 2,
		borderRadius: 4,
		overflow: "hidden",
		position: "relative",
		backgroundColor: currTheme.panel,
	},
	selectedStackItem: {
		borderWidth: 2,
		borderColor: "#4a90e2",
	},
	rotateSliderContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		width: "100%",
		paddingHorizontal: 8,
		marginBottom: 8,
	},
	rotateIconContainer: {
		width: 24,
		height: 24,
		justifyContent: "center",
		alignItems: "center",
	},
	rotateSliderWrapper: {
		flex: 1,
		marginLeft: 8,
		justifyContent: "center",
		alignItems: "stretch",
	},
	rotateSlider: {
		height: 20,
	},
	gridOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
	},
	gridLine: {
		position: "absolute",
		backgroundColor: currTheme.btntext,
		opacity: 0.3,
		zIndex: 3,
	},
	gridLineH: {
		position: "absolute",
		backgroundColor: currTheme.btntext,
		opacity: 0.3,
		height: 1,
		width: "100%",
		zIndex: 3,
	},
	gridLineV: {
		position: "absolute",
		backgroundColor: currTheme.btntext,
		opacity: 0.3,
		height: "100%",
		width: 1,
		zIndex: 3,
	},
	flipButtonContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
		width: "100%",
		paddingHorizontal: 8,
	},
	colorSlidersContainer: {
		marginBottom: 16,
	},
	colorSliderRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},
	colorSliderIcon: {
		marginRight: 8,
		width: 28,
		textAlign: "center",
	},
	colorSlider: {
		flex: 1,
		height: 20,
		marginRight: 8,
	},
	hueSliderContainer: {
		flex: 1,
		height: 20,
		marginRight: 8,
		position: "relative",
		justifyContent: "center",
	},
	hueGradient: {
		position: "absolute",
		height: 6,
		borderRadius: 3,
		left: 0,
		right: 0,
		top: 7,
		zIndex: 1,
	},
	hueSlider: {
		flex: 1,
		height: 20,
		zIndex: 2,
	},
});

const textStyles = StyleSheet.create({
	iconLabel: {
		color: currTheme.btntext,
		marginLeft: 10,
		fontSize: 12,
		fontWeight: "500",
		position: "absolute",
		top: ICON_SIZE + 2,
		left: 0,
		minWidth: 40,
		textAlign: "center",
		backgroundColor: currTheme.background,
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
		zIndex: 2,
	},
	stackHeader: {
		color: currTheme.text,
		fontSize: 14,
		fontWeight: "bold",
		marginBottom: 12,
		textAlign: "center",
	},
	selectedToolText: {
		color: currTheme.btntextSelected,
		fontWeight: "bold",
	},
	unselectedToolText: {
		color: currTheme.btntext,
		fontWeight: "bold",
	},
	toolboxTitle: {
		color: currTheme.btntext,
		fontWeight: "bold",
		fontSize: 16,
		marginBottom: 12,
	},
	editTitle: {
		color: currTheme.text,
		marginBottom: 12,
		fontSize: 16,
	},
	statusText: {
		color: currTheme.text,
		fontSize: 12,
		marginRight: 0,
	},
	zoomValue: {
		color: currTheme.text,
		fontSize: 12,
		marginHorizontal: 0,
		textAlign: "left",
	},
	imageStackOperation: {
		position: "absolute",
		bottom: 2,
		paddingHorizontal: 4,
		color: currTheme.text,
		fontSize: 12,
		textAlign: "left",
		backgroundColor: "rgba(0, 0, 0, 0.2)",
		paddingVertical: 2,
		borderRadius: 4,
	},
	versionText: {
		marginBottom: 8,
		padding: 4,
		color: currTheme.text,
		fontSize: 12,
		textAlign: "center",
	},
	statusLabel: {
		color: currTheme.text,
		fontSize: 12,
		marginRight: 4,
	},
	statusValue: {
		color: currTheme.text,
		fontSize: 12,
	},
	buttonText: {
		color: currTheme.btntext,
		fontWeight: "bold",
		textAlign: "center",
	},
	rotateValue: {
		color: currTheme.text,
		fontSize: 12,
		marginLeft: 8,
	},
	flipLabel: {
		color: currTheme.btntext,
		fontSize: 14,
		marginLeft: 8,
	},
	colorSliderValue: {
		color: currTheme.text,
		fontSize: 12,
		width: 40,
		textAlign: "right",
	},
});

const imageStyles = StyleSheet.create({
	logoImage: {
		width: "90%",
		height: 60,
		marginBottom: 4,
	},
	image: {
		borderRadius: 4,
		backgroundColor: currTheme.background,
	},
	imageStackThumb: {
		width: "100%",
		height: 80,
		borderRadius: 4,
		backgroundColor: currTheme.background,
	},
});
