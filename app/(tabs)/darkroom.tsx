/* eslint-disable @typescript-eslint/no-unused-vars */
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
		{ key: "rotate", icon: "refresh-outline", label: "Rotate" },
		{ key: "brightness", icon: "sunny-outline", label: "Brightness" },
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
	const [imageUri, setImageUri] = useState<string | null>(null);
	const [imageFileName, setImageFileName] = useState<string | null>(null);
	const [zoom, setZoom] = useState(1);
	const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
		null
	);
	const [imageSize, setImageSize] = useState<{
		width: number;
		height: number;
	} | null>(null);

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
		const result = await browseImageFile();
		if (result) {
			setImageUri(result.uri);
			setImageFileName(result.name);
			Image.getSize(result.uri, (width, height) => {
				setImageSize({ width, height });
			});
		}
	};

	const handleSaveAs = async () => {
		if (!imageUri || !imageFileName) return;
		// Read image as base64
		try {
			const response = await fetch(imageUri);
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
		// if (confirm("Crop completed, proceed or cancel?")) {
		// 	// User confirmed, proceed with crop
		// } else {
		// 	// User canceled, revert changes
		// }

		// Rectangle is now complete, you can add further crop logic here
	};

	const handleApply = () => {
		switch (selectedTool) {
			case "crop":
				applyCrop();
			default:
				break;
		}
		setModified(false); // Mark as unmodified after applying changes
	};

	const handleCancel = () => {
		setModified(false); // Mark as unmodified after canceling changes
	};

	const applyCrop = () => {
		if (!cropRect?.start || !cropRect?.end) return;

		// Apply cropping logic here
		// ...

		setCropRect(null); // Mark as unmodified after applying changes
	};

	const onImageLayout = (event: any) => {
		const { x, y, width, height } = event.nativeEvent.layout;
		setImagePosition({ x, y, width, height });
	};

	return (
		<View style={styles.container}>
			<View style={[styles.toolbox, { width: responsiveWidth }]}>
				{/* Add logo at the top of toolbox */}
				<View style={styles.logoContainer}>
					<Image
						source={require("../../assets/images/LuluArt.jpg")}
						style={styles.logoImage}
						resizeMode="contain"
					/>
					<Text style={styles.versionText}>{Version}</Text>
				</View>

				<View style={styles.fileBox}>
					<Text style={styles.fileBoxTitle}>File</Text>
					<View style={styles.iconRow}>
						{fileIcons.map((item) => (
							<Pressable
								key={item.key}
								style={styles.iconButton}
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
										<Ionicons name={item.icon} size={28} color="#fff" />
										{hovered && (
											<Text style={styles.iconLabel}>{item.label}</Text>
										)}
									</>
								)}
							</Pressable>
						))}
					</View>
				</View>
				<Text style={styles.toolboxTitle}>Toolbox</Text>
				<View style={styles.iconRow}>
					{toolIcons.map((item) => {
						const isSelected = selectedTool === item.key;
						return (
							<Pressable
								key={item.key}
								style={[
									styles.iconButton,
									isSelected ? styles.selectedTool : styles.unselectedTool,
								]}
								onPress={() => setSelectedTool(item.key)}
							>
								{({ hovered }) => (
									<>
										<Ionicons
											name={item.icon}
											size={28}
											color={isSelected ? "#fff" : "#cdf"}
										/>
										{hovered && (
											<Text
												style={[
													styles.iconLabel,
													isSelected
														? styles.selectedToolText
														: styles.unselectedToolText,
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
				{/* Add more tools as needed */}
			</View>
			<View style={styles.editArea}>
				<View style={styles.editAreaContent}>
					<View id="image-container" style={styles.imageContainer}>
						<View
							id="inner-image-container"
							style={[
								styles.innerImageContainer,
								{
									width: imageSize ? imageSize.width * zoom : 300 * zoom,
									height: imageSize ? imageSize.height * zoom : 300 * zoom,
									transform: [
										{
											translateX: imageSize
												? -(imageSize.width * zoom) / 2
												: -150 * zoom,
										},
										{
											translateY: imageSize
												? -(imageSize.height * zoom) / 2
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
									uri: imageUri
										? imageUri
										: "https://placehold.co/400x400?text=Edit+Image",
								}}
								style={[
									styles.image,
									imageSize
										? {
												width: imageSize.width * zoom,
												height: imageSize.height * zoom,
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
										styles.cropRectangle,
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
					<View style={styles.statusBar}>
						{selectedTool === "crop" && modified && (
							<View style={styles.cropButtonContainer}>
								<Pressable
									style={styles.applyButton}
									onPress={() => {
										// TODO: implement crop apply logic
										handleApply();
									}}
								>
									<Text style={styles.buttonText}>Apply</Text>
								</Pressable>
								<Pressable
									style={styles.cancelButton}
									onPress={() => {
										handleCancel();
									}}
								>
									<Text style={styles.buttonText}>Cancel</Text>
								</Pressable>
							</View>
						)}
						<View style={styles.statusSection}>
							<Text style={styles.statusText}>
								{cursorPos
									? `X: ${cursorPos.x}, Y: ${cursorPos.y}`
									: "X: 0, Y: 0"}
							</Text>
						</View>
						<View style={styles.statusSection}>
							<Text style={styles.statusText}>
								Zoom: {(zoom * 100).toFixed(0)}%
							</Text>
							<View style={styles.zoomBarContainer}>
								<Slider
									style={styles.slider}
									minimumValue={0.2}
									maximumValue={5}
									step={0.01}
									value={zoom}
									onValueChange={setZoom}
									minimumTrackTintColor="#fff"
									maximumTrackTintColor="#444"
									thumbTintColor="#888"
								/>
								<Text style={styles.zoomValue}>{zoom.toFixed(2)}x</Text>
							</View>
						</View>
						<View style={styles.statusSection}>
							<Text style={styles.statusText}>
								{imageFileName ? `File: ${imageFileName}` : "No file loaded"}
							</Text>
						</View>
					</View>
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
const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: "row",
		backgroundColor: "#224",
	},
	toolbox: {
		backgroundColor: "#222",
		padding: 12,
		justifyContent: "flex-start",
	},
	fileBox: {
		marginBottom: 18,
	},
	fileBoxTitle: {
		color: "#fff",
		fontWeight: "bold",
		marginBottom: 8,
		fontSize: 15,
	},
	iconRow: {
		flexDirection: "row",
		flexWrap: "nowrap",
		marginBottom: 8,
	},
	iconButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#444",
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
	selectedToolText: {
		color: "#fff",
	},
	unselectedToolText: {
		color: "#ddd",
	},
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
	toolboxTitle: {
		color: "#fff",
		fontWeight: "bold",
		marginBottom: 16,
		fontSize: 16,
	},
	editArea: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#111",
		position: "relative",
	},
	editAreaContent: {
		flex: 1,
		width: "100%",
	},
	editTitle: {
		color: "#aaa",
		marginBottom: 12,
		fontSize: 16,
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
	image: {
		width: 4800,
		height: 4000,
		borderRadius: 4,
		backgroundColor: "#555",
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
		left: 0,
		right: 0,
		width: "100%",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#222",
		paddingVertical: 4,
		paddingHorizontal: 8,
		borderRadius: 8,
	},
	statusSection: {
		flexDirection: "row",
		alignItems: "center",
	},
	statusText: {
		color: "#fff",
		fontSize: 12,
		marginRight: 8,
	},
	zoomBarContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	slider: {
		width: 100,
		height: 24,
	},
	zoomValue: {
		color: "#fff",
		fontSize: 12,
		marginHorizontal: 6,
	},
	cropButtonContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginRight: 12,
	},
	applyButton: {
		backgroundColor: "#2f3c2fff",
		paddingHorizontal: 14,
		paddingVertical: 6,
		borderRadius: 6,
		marginRight: 8,
	},
	cancelButton: {
		backgroundColor: "#433433ff",
		paddingHorizontal: 14,
		paddingVertical: 6,
		borderRadius: 6,
	},
	buttonText: {
		color: "#ccc",
		fontWeight: "bold",
	},
	logoContainer: {
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
		paddingBottom: 8,
		borderBottomWidth: 1,
		borderBottomColor: "#444",
	},
	logoImage: {
		width: "90%",
		height: 60,
		marginBottom: 4,
	},
	versionText: {
		color: "#999",
		fontSize: 10,
		textAlign: "center",
	},
});
