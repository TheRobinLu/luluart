import { Colors } from "@/constants/Colors";
import { ReleaseNote, Version } from "@/constants/const";
import React from "react";
import {
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

type ReleaseNoteModalProps = {
	visible: boolean;
	onClose: () => void;
};

export default function ReleaseNoteModal({
	visible,
	onClose,
}: ReleaseNoteModalProps) {
	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent={true}
			onRequestClose={onClose}
		>
			<View style={styles.overlay}>
				<View style={styles.container}>
					<Text style={styles.title}>Release Notes</Text>
					<Text style={styles.version}>{Version}</Text>
					<ScrollView style={styles.scroll}>
						<Text style={styles.notes}>{ReleaseNote}</Text>
					</ScrollView>
					<TouchableOpacity style={styles.closeBtn} onPress={onClose}>
						<Text style={styles.closeText}>Close</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	container: {
		backgroundColor: Colors.dark.background, // replaces #fff
		borderRadius: 12,
		padding: 20,
		width: "85%",
		maxHeight: "80%",
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 8,
		color: Colors.dark.text, // replaces default
	},
	version: {
		fontSize: 14,
		color: Colors.dark.text, // replaces #888
		marginBottom: 8,
	},
	scroll: {
		marginBottom: 16,
	},
	notes: {
		fontSize: 13,
		color: Colors.dark.text, // replaces #333
	},
	closeBtn: {
		alignSelf: "center",
		paddingVertical: 8,
		paddingHorizontal: 24,
		backgroundColor: Colors.dark.background, // replaces #eee
		borderRadius: 8,
	},
	closeText: {
		fontSize: 16,
		color: Colors.dark.text, // replaces #333
	},
});
