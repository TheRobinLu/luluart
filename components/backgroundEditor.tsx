/* eslint-disable @typescript-eslint/no-unused-vars */
import getText from "@/constants/dictionary"; // Import dictionary for translations
import Slider from "@react-native-community/slider";
import * as React from "react";
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
import { baseColors, currTheme } from "../constants/Colors";

// Dummy texture list
const TEXTURES = ["Canvas", "Paper", "Wood", "Metal"];

// Add interface for props
interface BackgroundEditorProps {
	lang: string; // Add language prop
	// NEW: callbacks to inform parent of option/prompt
	onOptionChange?: (option: string) => void;
	onPromptChange?: (prompt: string) => void;
}

export default function BackgroundEditor({
	lang = "EN",
	onOptionChange,
	onPromptChange,
}: BackgroundEditorProps) {
	const [selected, setSelected] = React.useState("");
	// Blur level presets (mapped to the slider 0-20 range)
	const BLUR_PRESETS = React.useMemo(
		() => [
			{ value: 1, label: "Slightly blurry" },
			{ value: 2, label: "Moderately blurry" },
			{ value: 3, label: "Noticeably blurry" },
			{ value: 4, label: "Strongly blurry" },
			{ value: 5, label: "Extremely blurry" },
		],
		[]
	);

	// Use a numeric state for the slider (0-20)
	const [blurLevel, setBlurLevel] = React.useState<number>(
		BLUR_PRESETS[0].value
	);

	const [color, setColor] = React.useState(baseColors.sky_300);
	const [texture, setTexture] = React.useState(TEXTURES[0]);
	const [replaceImg, setReplaceImg] = React.useState<string | null>(null);
	const [prompt, setPrompt] = React.useState("");

	// Notify parent when option changes
	React.useEffect(() => {
		onOptionChange?.(selected.toLowerCase());
	}, [selected, onOptionChange]);

	// Generate prompt based on selection and notify parent
	React.useEffect(() => {
		let p = "";
		if (selected === "Blur") {
			const preset = BLUR_PRESETS.find((pr) => pr.value === blurLevel);
			const blurLabel = preset?.label ?? `${blurLevel}`;
			p = `Apply a ${blurLabel} background to the image, keeping the main subjects exactly same as the original.`;
		} else if (selected === "Color") {
			p = `Change background color to ${color}.`;
		} else if (selected === "Texture") {
			p = `Apply texture: ${texture}.`;
		} else if (selected === "Replace") {
			p = replaceImg
				? `${"Replace background with selected image."}`
				: `${"Select an image to replace background."}`;
		}
		setPrompt(p);
		onPromptChange?.(p);
	}, [
		selected,
		blurLevel,
		color,
		texture,
		replaceImg,
		lang,
		onPromptChange,
		BLUR_PRESETS,
	]);

	// Dummy upload handler
	const handleUpload = () => {
		setReplaceImg("https://placekitten.com/200/200");
	};

	return (
		<View style={styles.container} id="bge-container">
			{/* Row 1: Icon buttons */}
			<View style={styles.row} id="bge-row-icons">
				{[
					{ key: "Blur", label: "Blur" },
					{ key: "Color", label: "Color" },
					{ key: "Texture", label: "Texture" },
					{ key: "Replace", label: "Replace" },
				].map((item) => (
					<Pressable
						key={item.key}
						style={[
							styles.iconButton,
							selected === item.key && styles.selectedButton,
						]}
						onPress={() => setSelected(item.key as any)}
						id={`bge-btn-${item.key.toLowerCase()}`}
					>
						<Ionicons
							name={
								item.key === "Blur"
									? "water-outline"
									: item.key === "Color"
										? "color-palette-outline"
										: item.key === "Texture"
											? "grid-outline"
											: "image-outline"
							}
							size={28}
							color={
								selected === item.key
									? baseColors.cyan_300
									: baseColors.cyan_500
							}
						/>
						<Text
							style={styles.iconLabel}
							id={`bge-label-${item.key.toLowerCase()}`}
						>
							{getText(lang, item.label)}
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
						<Text id="bge-blur-label">
							{getText(lang, "Blur Level")}: {blurLevel}
						</Text>
						<Slider
							style={{ width: 180 }}
							minimumValue={1}
							maximumValue={5}
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
						<Text id="bge-texture-label">{getText(lang, "Texture")}:</Text>
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
						<Button
							title={getText(lang, "Upload Image")}
							onPress={handleUpload}
						/>
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
					{getText(lang, "Prompt")}:
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
	// Updated to allow the TextInput to grow with content (auto-height)
	promptInput: {
		width: "100%",
		height: 80, // default height
		minHeight: 60,
		maxHeight: 100, // cap growth to avoid overflowing the layout
		borderWidth: 1,
		borderColor: currTheme.btnfaceSelected, // <-- use theme
		borderRadius: 6,
		padding: 8,
		paddingTop: 8,
		backgroundColor: currTheme.background, // <-- use theme
		color: currTheme.text, // <-- use theme
		textAlignVertical: "top", // ensures multi-line text starts at top on Android
	},
});
