import { IImageContext } from "@/app/interface/interface";
import { Client } from "@gradio/client";

export async function QwenImageEditAPI(
	imageContext: IImageContext,
	prompt: string
): Promise<IImageContext> {
	//const API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

	const originalImage = imageContext.uri;
	const client = await Client.connect("multimodalart/Qwen-Image-Edit-Fast");
	const result = await client.predict("/infer", {
		image: originalImage,
		prompt: prompt,
		seed: 0,
		randomize_seed: true,
		true_guidance_scale: 1,
		num_inference_steps: 4,
		rewrite_prompt: true,
	});

	if (result.data) {
		console.log(result.data);

		const editedImage: IImageContext = {
			...imageContext,
			uri: result.data as string,
		};

		return editedImage;
	}

	return imageContext;
}

// Export the function for use in other modules
