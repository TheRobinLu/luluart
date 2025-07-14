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
		setCursorPos({
			x: Math.round(locationX / zoom),
			y: Math.round(locationY / zoom),
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
		setCropRect({ start: { x: locationX, y: locationY }, end: null });
		setIsCropping(true);
	};

	const handleImageTouchMove = (event: any) => {
		// Always track mouse moves when cropping, even outside image bounds
		if (selectedTool !== "crop" || !isCropping || !cropRect?.start) return;

		// Get mouse position relative to where we started the view
		const { locationX, locationY, pageX, pageY } = event.nativeEvent;
		setCropRect((prev) =>
			prev ? { ...prev, end: { x: locationX, y: locationY } } : prev
		);
	};

	const handleImageTouchEnd = (event: any) => {
		// Keep tracking cursor position even when touch/click ends
		const { locationX, locationY } = event.nativeEvent;
		setCursorPos({
			x: Math.round(locationX / zoom),
			y: Math.round(locationY / zoom),
		});

		// Only do crop handling if we're in crop mode
		if (selectedTool !== "crop" || !isCropping || !cropRect?.start) return;
		setCropRect((prev) =>
			prev ? { ...prev, end: { x: locationX, y: locationY } } : prev
		);
		setIsCropping(false);
		// Rectangle is now complete, you can add further crop logic here
	};

	const onImageLayout = (event: any) => {
		const { x, y, width, height } = event.nativeEvent.layout;
		setImagePosition({ x, y, width, height });
	};

	return (
		<View style={styles.container}>
			<View style={[styles.toolbox, { width: responsiveWidth }]}>
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
									isSelected
										? { backgroundColor: "#555" }
										: { backgroundColor: "#333" },
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
													isSelected ? { color: "#fff" } : { color: "#ddd" },
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
				<View style={{ flex: 1, width: "100%" }}>
					<View id="image-container" style={styles.imageContainer}>
						<View
							id="inner-image-container"
							style={{
								width: imageSize ? imageSize.width * zoom : 300 * zoom,
								height: imageSize ? imageSize.height * zoom : 300 * zoom,
								justifyContent: "center",
								alignItems: "center",
								position: "absolute",
								top: "50%",
								left: "50%",
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
							}}
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
									style={{
										position: "absolute",
										left: Math.min(cropRect.start.x, cropRect.end.x),
										top: Math.min(cropRect.start.y, cropRect.end.y),
										width: Math.abs(cropRect.end.x - cropRect.start.x),
										height: Math.abs(cropRect.end.y - cropRect.start.y),
										borderWidth: 2,
										borderColor: "#fff",
										borderStyle: "dashed",
										zIndex: 10,
									}}
									pointerEvents="none"
								/>
							)}
						</View>
					</View>
					{/* Status bar moved to absolute bottom */}
					<View style={styles.statusBar}>
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
								{/* Replace zoom +/- buttons with a slider */}
								<Slider
									style={{ width: 100, height: 24 }}
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

const ICON_SIZE = 42;
const ICON_MARGIN = 6;
const MIN_ICONS = 3;
const MAX_ICONS = 6;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: "row",
		backgroundColor: "#224",
	},
	toolbox: {
		// width is now set dynamically
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
		position: "relative", // add this
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
	image: {
		width: 4800,
		height: 4000,
		borderRadius: 4,
		backgroundColor: "#555",
	},
	statusBar: {
		position: "absolute", // add this
		bottom: 0, // add this
		left: 0, // add this
		right: 0, // add this
		width: "100%",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#222",
		paddingVertical: 4, // reduced from 8
		paddingHorizontal: 8, // reduced from 16
		borderRadius: 8,
	},
	statusSection: {
		flexDirection: "row",
		alignItems: "center",
	},
	statusText: {
		color: "#fff",
		fontSize: 12, // reduced from 15
		marginRight: 8, // reduced from 12
	},
	zoomBarContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	zoomBar: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#333",
		borderRadius: 6,
		paddingHorizontal: 8,
		paddingVertical: 4,
	},

	zoomBtn: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: "#444",
		alignItems: "center",
		justifyContent: "center",
		marginHorizontal: 4,
	},
	zoomBtnText: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "bold",
	},
	zoomValue: {
		color: "#fff",
		fontSize: 12, // reduced from 15
		marginHorizontal: 6, // reduced from 8
	},
});
