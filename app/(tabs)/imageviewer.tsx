import * as FileSystem from "expo-file-system";
import React, { useEffect, useState } from "react";
import {
	FlatList,
	Image,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

export default function ImageViewerScreen() {
	const [images, setImages] = useState<string[]>([]);
	const [selectedImage, setSelectedImage] = useState<string | null>(null);

	useEffect(() => {
		const loadImages = async () => {
			// Example: Load images from the app's document directory
			const dir = FileSystem.documentDirectory || "";
			const files = await FileSystem.readDirectoryAsync(dir);
			const imageFiles = files
				.filter((f) => f.match(/\.(jpg|jpeg|png|gif)$/i))
				.map((f) => dir + f);
			setImages(imageFiles);
		};
		loadImages();
	}, []);

	return (
		<View style={{ flex: 1, backgroundColor: "#fff" }}>
			{selectedImage ? (
				<TouchableOpacity
					style={styles.fullscreen}
					onPress={() => setSelectedImage(null)}
				>
					<Image
						source={{ uri: selectedImage }}
						style={styles.fullImage}
						resizeMode="contain"
					/>
				</TouchableOpacity>
			) : (
				<FlatList
					data={images}
					keyExtractor={(item) => item}
					numColumns={3}
					contentContainerStyle={{ padding: 8 }}
					renderItem={({ item }) => (
						<TouchableOpacity onPress={() => setSelectedImage(item)}>
							<Image source={{ uri: item }} style={styles.thumb} />
						</TouchableOpacity>
					)}
					ListEmptyComponent={<Text>No images found.</Text>}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	thumb: {
		width: 100,
		height: 100,
		margin: 4,
		borderRadius: 8,
		backgroundColor: "#eee",
	},
	fullscreen: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#000",
	},
	fullImage: {
		width: "100%",
		height: "100%",
	},
});
