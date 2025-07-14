import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function TabLayout() {
	const colorScheme = useColorScheme();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme ?? "dark"].tint,
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarBackground: TabBarBackground,
				tabBarStyle: Platform.select({
					ios: {
						// Use a transparent background on iOS to show the blur effect
						position: "absolute",
					},
					default: {},
				}),
				tabBarLabelPosition: "beside-icon", // Move labels beside icons (closest to "top" for bottom tabs)
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: ({ color }) => (
						<Ionicons name="home" size={28} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="darkroom"
				options={{
					title: "DarkRoom",
					tabBarIcon: ({ color }) => (
						<Ionicons name="sparkles" size={28} color={color} />
					),
				}}
			/>{" "}
			<Tabs.Screen
				name="imageviewer"
				options={{
					title: "ImageViewer",
					tabBarIcon: ({ color }) => (
						<Ionicons name="images" size={28} color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
