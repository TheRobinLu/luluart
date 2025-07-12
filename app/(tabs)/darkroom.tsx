/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Slider from "@react-native-community/slider";
import React, { useEffect, useRef, useState } from "react";
import {
	Dimensions,
	Image,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { browseImageFile } from "../../util/sysfile"; // adjust path if needed

export default function DarkroomScreen() {
	//const [hovered, setHovered] = useState<string | null>(null);

	const fileIcons = [
		{ key: "open", icon: "folder-open-outline", label: "Open" },
		{ key: "save", icon: "save-outline", label: "Save" },
		{ key: "saveas", icon: "newspaper-outline", label: "Save As" },
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
	const [zoom, setZoom] = useState(1);
	const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
		null
	);
	const [imageSize, setImageSize] = useState<{
		width: number;
		height: number;
	} | null>(null);

	const imageRef = useRef<Image>(null);

	const handleImageTouch = (event: any) => {
		const { locationX, locationY } = event.nativeEvent;
		setCursorPos({
			x: Math.round(locationX / zoom),
			y: Math.round(locationY / zoom),
		});
	};

	// Removed unused handleZoomChange function

	useEffect(() => {
		const onChange = ({ window }: { window: { width: number } }) => {
			setResponsiveWidth(calcResponsiveWidth(window.width));
		};
		const subscription = Dimensions.addEventListener("change", onChange);
		return () => {
			subscription?.remove?.();
		};
	}, []);

	const handleOpenFile = async () => {
		const uri = await browseImageFile();
		if (uri) {
			setImageUri(uri);
			Image.getSize(uri, (width, height) => {
				setImageSize({ width, height });
			});
		}
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
								onPress={item.key === "open" ? handleOpenFile : undefined}
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
					{toolIcons.map((item) => (
						<Pressable key={item.key} style={styles.iconButton}>
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
				{/* Add more tools as needed */}
			</View>
			<View style={styles.editArea}>
				<Text style={styles.editTitle}>Image Edit Area</Text>
				<View style={{ flex: 1, width: "100%" }}>
					<View style={styles.imageContainer}>
						<View
							onStartShouldSetResponder={() => true}
							onResponderMove={handleImageTouch}
							onResponderGrant={handleImageTouch}
						>
							<Image
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
							/>
						</View>
					</View>
					{/* Status bar moved to absolute bottom */}
					<View style={styles.statusBar}>
						<View style={styles.statusSection}>
							<Text style={styles.statusText}>
								{cursorPos
									? `Cursor: (${cursorPos.x}, ${cursorPos.y})`
									: "Cursor: (-, -)"}
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
									minimumValue={0.5}
									maximumValue={3}
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
		backgroundColor: "#222",
	},
	toolbox: {
		// width is now set dynamically
		backgroundColor: "#333",
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
