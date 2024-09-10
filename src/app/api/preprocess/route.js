// Lance's updated route of Jessy's route.js this doesnt save the processed image as Tensor json anymore because GPT said it may not be ideal and instead returns to the user

import { processImage } from "../../model/prepareDataset/utilities/preProcess";

// Ensure this runs only on the server
export const runtime = "nodejs";

export async function POST(req, res) {
  try {
    const { imagePath } = await req.json(); // Extract image path from request

    if (!imagePath) {
      return new Response(JSON.stringify({ error: "No image path provided" }), {
        status: 400,
      });
    }

    // Process the image server-side using TensorFlow Node.js
    const processedImage = await processImage(imagePath);

    if (!processedImage) {
      return new Response(JSON.stringify({ error: "Failed to process image" }), {
        status: 500,
      });
    }

    // You can decide to return more detailed info or save processedImage
    return new Response(JSON.stringify({ success: true, message: "Image processed successfully" }), {
      status: 200,
    });
  } catch (err) {
    console.error("Error during image preprocessing:", err);
    return new Response(
      JSON.stringify({ error: "Image preprocessing failed" }),
      { status: 500 }
    );
  }
}
