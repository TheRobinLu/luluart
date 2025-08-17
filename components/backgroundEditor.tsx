import Slider from "@react-native-community/slider";
import React, { useState } from "react";
import {
	Button,
	Image,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { baseColors, currTheme } from "../constants/Colors"; // <-- add this import

// Dummy texture list
const TEXTURES = ["Canvas", "Paper", "Wood", "Metal"];

export default function BackgroundEditor() {
	const [selected, setSelected] = useState<
		"Blur" | "Color" | "Texture" | "Replace"
	>("Blur");
	const [blurLevel, setBlurLevel] = useState(5);
	const [color, setColor] = useState(baseColors.sky_300);
	const [texture, setTexture] = useState(TEXTURES[0]);
	const [replaceImg, setReplaceImg] = useState<string | null>(null);
	const [prompt, setPrompt] = useState("");

	// Generate prompt based on selection
	React.useEffect(() => {
		let p = "";
		if (selected === "Blur") p = `Apply blur with level ${blurLevel}.`;
		else if (selected === "Color") p = `Change background color to ${color}.`;
		else if (selected === "Texture") p = `Apply texture: ${texture}.`;
		else if (selected === "Replace")
			p = replaceImg
				? `Replace background with selected image.`
				: "Select an image to replace background.";
		setPrompt(p);
	}, [selected, blurLevel, color, texture, replaceImg]);

	// Dummy upload handler
	const handleUpload = () => {
		setReplaceImg("https://placekitten.com/200/200");
	};

	return (
		<View style={styles.container} id="bge-container">
			{/* Row 1: Icon buttons */}
			<View style={styles.row} id="bge-row-icons">
				{["Blur", "Color", "Texture", "Replace"].map((key) => (
					<Pressable
						key={key}
						style={[
							styles.iconButton,
							selected === key && styles.selectedButton,
						]}
						onPress={() => setSelected(key as any)}
						id={`bge-btn-${key.toLowerCase()}`}
					>
						<Ionicons
							name={
								key === "Blur"
									? "water-outline"
									: key === "Color"
										? "color-palette-outline"
										: key === "Texture"
											? "grid-outline"
											: "image-outline"
							}
							size={28}
							color={
								selected === key ? baseColors.cyan_300 : baseColors.cyan_500
							}
						/>
						<Text
							style={styles.iconLabel}
							id={`bge-label-${key.toLowerCase()}`}
						>
							{key}
						</Text>
					</Pressable>
				))}
			</View>
			{/* Row 2: Preview image */}
			<View style={styles.previewRow} id="bge-row-preview">
				<Image
					source={{
						uri: replaceImg || "https://placehold.co/200x120?text=Preview",
					}}
					style={styles.previewImg}
					resizeMode="cover"
					id="bge-preview-img"
				/>
			</View>
			{/* Row 3: Controls */}
			<View style={styles.controlRow} id="bge-row-controls">
				{selected === "Blur" && (
					<View style={styles.sliderRow} id="bge-blur-controls">
						<Text id="bge-blur-label">Blur Level: {blurLevel}</Text>
						<Slider
							style={{ width: 180 }}
							minimumValue={0}
							maximumValue={20}
							step={1}
							value={blurLevel}
							onValueChange={setBlurLevel}
							id="bge-blur-slider"
						/>
					</View>
				)}
				{selected === "Color" && (
					<View style={styles.colorRow} id="bge-color-controls">
						<View
							style={[styles.colorPreview, { backgroundColor: color }]}
							id="bge-color-preview"
						/>
					</View>
				)}
				{selected === "Texture" && (
					<View style={styles.textureRow} id="bge-texture-controls">
						<Text id="bge-texture-label">Texture:</Text>
						<select
							style={styles.textureDropdown as any}
							value={texture}
							onChange={(e) => setTexture(e.target.value)}
							id="bge-texture-dropdown"
						>
							{TEXTURES.map((t) => (
								<option
									key={t}
									value={t}
									id={`bge-texture-option-${t.toLowerCase()}`}
								>
									{t}
								</option>
							))}
						</select>
					</View>
				)}
				{selected === "Replace" && (
					<View style={styles.replaceRow} id="bge-replace-controls">
						<Button title="Upload Image" onPress={handleUpload} />
						{replaceImg && (
							<Image
								source={{ uri: replaceImg }}
								style={styles.uploadedImg}
								id="bge-uploaded-img"
							/>
						)}
					</View>
				)}
			</View>
			{/* Row 4: Prompt text area */}
			<View style={styles.promptRow} id="bge-row-prompt">
				<Text style={styles.promptLabel} id="bge-prompt-label">
					Prompt:
				</Text>
				<TextInput
					style={styles.promptInput}
					value={prompt}
					multiline
					editable={false}
					id="bge-prompt-input"
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		width: 290,
		padding: 8,
		backgroundColor: baseColors.slate_950, // <-- use theme
		borderRadius: 8,
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 8,
	},
	iconButton: {
		alignItems: "center",
		padding: 8,
		borderRadius: 8,
		backgroundColor: currTheme.btnface, // <-- use theme
		color: currTheme.text, // <-- use theme
		width: 60,
	},
	selectedButton: {
		backgroundColor: currTheme.btnfaceSelected, // <-- use theme
	},
	iconLabel: {
		fontSize: 12,
		marginTop: 4,
		color: currTheme.tint, // <-- use theme
	},
	previewRow: {
		alignItems: "center",
		marginBottom: 12,
	},
	previewImg: {
		width: 200,
		height: 120,
		borderRadius: 8,
		backgroundColor: currTheme.background, // <-- use theme
	},
	controlRow: {
		marginBottom: 12,
	},
	sliderRow: {
		alignItems: "center",
	},
	colorRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	colorInput: {
		width: 80,
		height: 32,
		borderWidth: 1,
		borderColor: currTheme.btnfaceSelected, // <-- use theme
		borderRadius: 6,
		paddingHorizontal: 8,
		backgroundColor: currTheme.background, // <-- use theme
		color: currTheme.text, // <-- use theme
	},
	colorPreview: {
		width: 32,
		height: 32,
		borderRadius: 6,
		borderWidth: 1,
		borderColor: currTheme.btnfaceSelected, // <-- use theme
	},
	textureRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	textureDropdown: {
		width: 120,
		height: 32,
		borderRadius: 6,
		borderWidth: 1,
		borderColor: currTheme.btnfaceSelected, // <-- use theme
		paddingHorizontal: 8,
		backgroundColor: currTheme.background, // <-- use theme
		color: currTheme.text, // <-- use theme
	},
	replaceRow: {
		alignItems: "center",
	},
	uploadedImg: {
		width: 80,
		height: 80,
		borderRadius: 8,
		marginTop: 8,
		backgroundColor: currTheme.background, // <-- use theme
	},
	promptRow: {
		marginTop: 8,
	},
	promptLabel: {
		fontWeight: "bold",
		marginBottom: 4,
		color: currTheme.text, // <-- use theme
	},
	promptInput: {
		width: "100%",
		minHeight: 40,
		borderWidth: 1,
		borderColor: currTheme.btnfaceSelected, // <-- use theme
		borderRadius: 6,
		padding: 8,
		backgroundColor: currTheme.background, // <-- use theme
		color: currTheme.text, // <-- use theme
	},
});
