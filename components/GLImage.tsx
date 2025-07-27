import { Asset } from "expo-asset";
import { Node, Shaders, Surface } from "gl-react";
import React from "react";
import { Image, ImageResizeMode } from "react-native";

// Fallback: Just apply brightness via style for now if GL is not available
type GLImageProps = {
	source: any;
	width: number;
	height: number;
	brightness?: number;
	contrast?: number;
	saturate?: number;
	flipH?: boolean;
	flipV?: boolean;
	rotation?: number;
	resizeMode?: ImageResizeMode;
	onLayout?: (event: any) => void;
};

// Fallback: Just apply brightness via style for now if GL is not available
export default function GLImage({
	source,
	width,
	height,
	brightness = 1,
	contrast = 1,
	saturate = 1,
	flipH = false,
	flipV = false,
	rotation = 0,
	resizeMode = "contain" as ImageResizeMode,
	onLayout,
}: GLImageProps) {
	// If GL is available, use GL rendering, otherwise fallback to Image
	const isGLAvailable = false; // Replace with actual GL detection logic if needed
	if (isGLAvailable) {
		const asset = Asset.fromURI(source.uri);

		const shaders = Shaders.create({
			ImageAdjust: {
				frag: `
				precision highp float;
				varying vec2 uv;
				uniform sampler2D image;
				uniform float brightness;
				uniform float contrast;
				uniform float saturate;
				void main () {
					vec4 color = texture2D(image, uv);
					color.rgb *= brightness;
					color.rgb = (color.rgb - 0.5) * contrast + 0.5;
					float avg = (color.r + color.g + color.b) / 3.0;
					color.rgb = mix(vec3(avg), color.rgb, saturate);
					gl_FragColor = color;
				}
				`,
			},
		});

		return (
			<Surface style={{ width, height }}>
				<Node
					shader={shaders.ImageAdjust}
					uniforms={{
						image: asset,
						brightness,
						contrast,
						saturate,
					}}
				/>
			</Surface>
		);
	}
	// Compose style for brightness/contrast/saturate using CSS filters (web only)
	const style = {
		width,
		height,
		transform: [
			flipH ? { scaleX: -1 } : { scaleX: 1 },
			flipV ? { scaleY: -1 } : { scaleY: 1 },
			{ rotate: `${rotation}deg` },
		],
		...(typeof window !== "undefined"
			? {
					filter: `brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`,
				}
			: {}),
	};

	return (
		<Image
			source={source}
			style={style}
			resizeMode={resizeMode}
			onLayout={onLayout}
		/>
	);
}
