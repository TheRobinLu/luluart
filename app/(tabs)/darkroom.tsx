/* eslint-disable @typescript-eslint/no-unused-vars */
//import { crop } from "@/util/imageEdit";
import { IImageContext } from "@/app/interface/interface";
import { cropByPoints } from "@/util/imageEdit";
import Slider from "@react-native-community/slider";
import React, { useRef, useState } from "react";
import {
	Dimensions,
	Image,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Version } from "../../constants/const";
import { browseImageFile, saveAsImageFile } from "../../util/sysfile"; // adjust path if needed

export default function DarkroomScreen() {
	//const [hovered, setHovered] = useState<string | null>(null);

	const fileIcons = [
		{ key: "open", icon: "folder-open-outline", label: "Open" },
		{ key: "save", icon: "save-outline", label: "Save" },
	];

	const toolIcons = [
		{ key: "crop", icon: "crop-outline", label: "Crop" },
		{ key: "rotate", icon: "sync-outline", label: "Rotate" },
		{ key: "brightness", icon: "sunny-outline", label: "Brightness" },
		{ key: "contrast", icon: "contrast-outline", label: "Contrast" },
		{ key: "flip", icon: "grid-outline", label: "Flip" },
	];

	const ICON_SIZE = 42;
	const ICON_MARGIN = 6;
	const MIN_ICONS = 3;
	const MAX_ICONS = 6;
	const minWidth = ICON_SIZE * MIN_ICONS + ICON_MARGIN * (MIN_ICONS - 1) + 24;
	const maxWidth = ICON_SIZE * MAX_ICONS + ICON_MARGIN * (MAX_ICONS - 1) + 24;

	const calcResponsiveWidth = (screenWidth: number) =>
		Math.min(
			Math.max(minWidth, screenWidth * 0.18),
			Math.max(maxWidth, screenWidth * 0.4)
		);

	const [responsiveWidth, setResponsiveWidth] = useState(
		calcResponsiveWidth(Dimensions.get("window").width)
	);
	const [editImage, setEditImage] = useState<IImageContext | null>(null);

	const [imageFileName, setImageFileName] = useState<string | null>(null);
	const [zoom, setZoom] = useState(1);
	const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
		null
	);

	const [imageStack, setImageStack] = useState<IImageContext[]>([]);

	const [modified, setModified] = useState(false); // Track if image has been modified
	// Track if image has been modified, used for save confirmation
	const [selectedTool, setSelectedTool] = useState<string | null>(null);
	const [cropRect, setCropRect] = useState<{
		start: { x: number; y: number } | null;
		end: { x: number; y: number } | null;
	} | null>(null);
	const [isCropping, setIsCropping] = useState(false);

	const imageRef = useRef<Image>(null);
	const [imagePosition, setImagePosition] = useState({
		x: 0,
		y: 0,
		width: 0,
		height: 0,
	});

	const handleImageTouch = (event: any) => {
		const { locationX, locationY } = event.nativeEvent;
		setCursorPos({
			x: Math.round(locationX / zoom),
			y: Math.round(locationY / zoom),
		});
	};

	// Add this function to track cursor position during all mouse/touch movements
	const handleMouseMove = (event: any) => {
		const { locationX, locationY } = event.nativeEvent;
		// Always update cursor position regardless of image bounds
		// Ensure x and y are never negative
		setCursorPos({
			x: Math.max(0, Math.round(locationX / zoom)),
			y: Math.max(0, Math.round(locationY / zoom)),
		});
	};

	const handleOpenFile = async () => {
		const result: IImageContext | null = await browseImageFile();
		if (result) {
			setEditImage(result);

			const stack = { ...result, operations: "original" };
			setImageStack((prev) => [...prev, stack]);
		}
	};

	const handleSaveAs = async () => {
		if (!editImage?.uri || !imageFileName) return;
		// Read image as base64
		try {
			const response = await fetch(editImage.uri);
			const blob = await response.blob();
			const reader = new FileReader();
			reader.onloadend = async () => {
				const base64 = (reader.result as string).split(",")[1];
				await saveAsImageFile(base64, imageFileName);
			};
			reader.readAsDataURL(blob);
		} catch (e) {
			console.error("Save failed", e);
		}
	};

	const handleImageTouchStart = (event: any) => {
		if (selectedTool !== "crop") return;
		const { locationX, locationY } = event.nativeEvent;
		setCropRect({
			start: {
				x: Math.max(0, locationX),
				y: Math.max(0, locationY),
			},
			end: null,
		});
		setIsCropping(true);
	};

	const handleImageTouchMove = (event: any) => {
		// Always track mouse moves when cropping, even outside image bounds
		if (selectedTool !== "crop" || !isCropping || !cropRect?.start) return;

		// Get mouse position relative to where we started the view
		const { locationX, locationY } = event.nativeEvent;
		setCropRect((prev) =>
			prev
				? {
						...prev,
						end: {
							x: Math.max(0, Math.min(locationX, imagePosition.width)),
							y: Math.max(0, Math.min(locationY, imagePosition.height)),
						},
					}
				: prev
		);
	};

	const handleImageTouchEnd = (event: any) => {
		// Keep tracking cursor position even when touch/click ends
		const { locationX, locationY } = event.nativeEvent;
		setCursorPos({
			x: Math.max(0, Math.round(locationX / zoom)),
			y: Math.max(0, Math.round(locationY / zoom)),
		});

		// Only do crop handling if we're in crop mode
		if (selectedTool !== "crop" || !isCropping || !cropRect?.start) return;
		setCropRect((prev) =>
			prev
				? {
						...prev,
						end: {
							x: Math.max(0, Math.min(locationX, imagePosition.width)),
							y: Math.max(0, Math.min(locationY, imagePosition.height)),
						},
					}
				: prev
		);
		setIsCropping(false);
		setModified(true); // Mark as modified after cropping
	};

	const handleApply = async () => {
		let result: IImageContext | null = null;

		switch (selectedTool) {
			case "crop":
				result = (await applyCrop()) ?? null;
			default:
				break;
		}

		if (result) {
			setEditImage(result);
			// Add to image stack with operation
			const stack = { ...result, operations: selectedTool || "modified" };
			setImageStack((prev) => [...prev, stack]);
		}

		setModified(false); // Mark as unmodified after applying changes
	};

	const handleCancel = () => {
		setModified(false); // Mark as unmodified after canceling changes
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

	const onImageLayout = (event: any) => {
		const { x, y, width, height } = event.nativeEvent.layout;
		setImagePosition({ x, y, width, height });
	};

	return (
		<View style={viewStyles.container}>
			{/* Image stack thumbnails - now on the left side */}
			{imageStack.length > 0 && (
				<View style={viewStyles.imageStackContainer}>
					<Text style={textStyles.stackHeader}>History</Text>
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
							<Text style={textStyles.imageStackOperation}>
								{item.operations}
							</Text>
						</Pressable>
					))}
				</View>
			)}

			<View style={viewStyles.editArea}>
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
								handleMouseMove(event);
								handleImageTouchMove(event);
							}}
							onResponderRelease={handleImageTouchEnd}
						>
							<Image
								id="image"
								ref={imageRef}
								source={{
									uri: editImage?.uri
										? editImage.uri
										: "https://placehold.co/400x400?text=Edit+Image",
								}}
								style={[
									imageStyles.image,
									editImage
										? {
												width: editImage.width * zoom,
												height: editImage.height * zoom,
											}
										: { width: 300 * zoom, height: 300 * zoom }, // fallback
								]}
								resizeMode="contain"
								onLayout={onImageLayout}
							/>
							{/* Crop rectangle overlay */}
							{selectedTool === "crop" && cropRect?.start && cropRect?.end && (
								<View
									style={[
										viewStyles.cropRectangle,
										{
											left: Math.min(cropRect.start.x, cropRect.end.x),
											top: Math.min(cropRect.start.y, cropRect.end.y),
											width: Math.abs(cropRect.end.x - cropRect.start.x),
											height: Math.abs(cropRect.end.y - cropRect.start.y),
										},
									]}
									pointerEvents="none"
								/>
							)}
						</View>
					</View>
					{/* Status bar moved to absolute bottom */}
					<View style={viewStyles.statusBar}>
						{/* Consolidated status bar with all info in one row */}
						<View style={viewStyles.statusRowContainer}>
							<Text style={textStyles.statusValue}>
								{cursorPos
									? `X: ${cursorPos.x} Y: ${cursorPos.y}`
									: "X: 0 Y: 0"}
							</Text>

							<View style={viewStyles.zoomBarContainer}>
								<View style={{ flexDirection: "row", alignItems: "center" }}>
									<Text style={textStyles.statusText}>Zoom: </Text>
									<Text style={textStyles.zoomValue}>
										{(zoom * 100).toFixed(0)}%
									</Text>
								</View>
								<Slider
									style={viewStyles.slider}
									minimumValue={0.2}
									maximumValue={5}
									step={0.1}
									value={zoom}
									onValueChange={setZoom}
									minimumTrackTintColor="#4a90e2"
									maximumTrackTintColor="#333"
									thumbTintColor="#fff"
								/>
								<Text style={textStyles.zoomValue}>{zoom.toFixed(1)}x</Text>
							</View>

							<Text style={textStyles.statusText}>
								{editImage
									? editImage.name
										? `File: ${editImage.name}`
										: "No file loaded"
									: "No file loaded"}
							</Text>
						</View>
					</View>
				</View>
			</View>

			<View style={[viewStyles.toolbox, { width: responsiveWidth }]}>
				{/* Add logo at the top of toolbox */}
				<View style={viewStyles.logoContainer}>
					<Image
						source={require("../../assets/images/LuluArt.jpg")}
						style={imageStyles.logoImage}
						resizeMode="contain"
					/>
					<Text style={textStyles.versionText}>{Version}</Text>
				</View>

				<View style={viewStyles.fileBox}>
					<Text style={textStyles.toolboxTitle}>File</Text>
					<View style={viewStyles.iconRow}>
						{fileIcons.map((item) => (
							<Pressable
								key={item.key}
								style={[viewStyles.iconButton]}
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
										<Ionicons name={item.icon} size={28} color="#ccccff" />
										{hovered && (
											<Text style={textStyles.iconLabel}>{item.label}</Text>
										)}
									</>
								)}
							</Pressable>
						))}
					</View>
				</View>
				<Text style={textStyles.toolboxTitle}>Toolbox</Text>
				<View style={viewStyles.iconRow}>
					{toolIcons.map((item) => {
						const isSelected = selectedTool === item.key;
						return (
							<Pressable
								key={item.key}
								style={[
									viewStyles.iconButton,
									isSelected
										? viewStyles.selectedTool
										: viewStyles.unselectedTool,
								]}
								onPress={() => setSelectedTool(item.key)}
							>
								{({ hovered }) => (
									<>
										<Ionicons
											name={item.icon}
											size={28}
											color={isSelected ? "#ffffff" : "#ccccff"}
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
												{item.label}
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

				{/* Action buttons at the bottom of toolbox */}
				{selectedTool === "crop" && modified && (
					<View style={viewStyles.actionButtonContainer}>
						<Pressable
							style={viewStyles.button}
							onPress={() => {
								handleApply();
							}}
						>
							<Text style={textStyles.buttonText}>Apply</Text>
						</Pressable>
						<Pressable
							style={viewStyles.button}
							onPress={() => {
								handleCancel();
							}}
						>
							<Text style={textStyles.buttonText}>Cancel</Text>
						</Pressable>
					</View>
				)}
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
		backgroundColor: "#2f2f2f",
	},
	toolbox: {
		backgroundColor: "#202020",
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
		backgroundColor: "#404040",
		padding: 6,
		marginRight: ICON_MARGIN,
		borderRadius: 6,
		maxHeight: ICON_SIZE,
		maxWidth: ICON_SIZE,
		justifyContent: "center",
	},
	selectedTool: {
		backgroundColor: "#555",
	},
	unselectedTool: {
		backgroundColor: "#333",
	},
	toolboxTitle: {
		marginBottom: 16,
	},
	editArea: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#111",
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
		borderColor: "#aaa",
		borderStyle: "dashed",
		zIndex: 10,
	},
	statusBar: {
		position: "absolute",
		bottom: 0,
		backgroundColor: "#222",
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
		backgroundColor: "#444",
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
		backgroundColor: "#404040",
		color: "#b0b0b0",
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
		borderBottomColor: "#444",
	},
	imageStackContainer: {
		width: 100,
		backgroundColor: "#1a1a1a",
		flexDirection: "column", // Changed from row to column
		padding: 8,
		position: "relative", // Changed from absolute positioning
		height: "100%", // Take full height
		borderLeftWidth: 1,
		borderLeftColor: "#303030",
		zIndex: 2, // Ensure it appears below the edit area
	},
	imageStackItem: {
		width: 84, // Fixed width
		height: 100, // Taller to accommodate the operation label
		marginBottom: 10, // Vertical spacing between items
		marginRight: 0, // Remove right margin
		borderRadius: 4,
		overflow: "hidden",
		position: "relative",
		backgroundColor: "#262626",
	},
	selectedStackItem: {
		borderWidth: 2,
		borderColor: "#4a90e2",
	},
});

const textStyles = StyleSheet.create({
	iconLabel: {
		color: "#fff",
		marginLeft: 10,
		fontSize: 15,
		fontWeight: "500",
		position: "absolute",
		top: ICON_SIZE + 2,
		left: 0,
		backgroundColor: "#222",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
		zIndex: 2,
	},
	stackHeader: {
		color: "#fff",
		fontSize: 14,
		fontWeight: "bold",
		marginBottom: 12,
		textAlign: "center",
	},
	selectedToolText: {
		color: "#fff",
		fontWeight: "bold",
	},
	unselectedToolText: {
		color: "#ddd",
		fontWeight: "bold",
	},
	toolboxTitle: {
		color: "#b0b0b0",
		fontWeight: "bold",
		fontSize: 16,
		marginBottom: 12,
	},
	editTitle: {
		color: "#aaa",
		marginBottom: 12,
		fontSize: 16,
	},
	statusText: {
		color: "#fff",
		fontSize: 12,
		marginRight: 0,
	},
	zoomValue: {
		color: "#fff",
		fontSize: 12,
		marginHorizontal: 0,
		textAlign: "left",
	},
	imageStackOperation: {
		position: "absolute",
		bottom: 2,
		left: 2,
		right: 2,
		color: "#fff",
		fontSize: 12,
		textAlign: "center",
		backgroundColor: "rgba(0, 0, 0, 0.2)",
		paddingVertical: 2,
		borderRadius: 4,
	},
	versionText: {
		marginBottom: 8,
		color: "#999",
		fontSize: 10,
		textAlign: "center",
	},
	statusLabel: {
		color: "#fff",
		fontSize: 12,
		marginRight: 4,
	},
	statusValue: {
		color: "#fff",
		//width: 12,
		fontSize: 12,
		//fontWeight: "bold",
	},
	buttonText: {
		color: "#fff",
		fontWeight: "bold",
		textAlign: "center",
	},
	temp: {
		// flexDirection: "column",
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
		backgroundColor: "#555",
	},
	imageStackThumb: {
		width: "100%",
		height: 80, // Adjust thumbnail height
		borderRadius: 4,
		backgroundColor: "#555",
	},
});
