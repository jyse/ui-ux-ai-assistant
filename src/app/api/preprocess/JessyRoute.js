import { processImage } from "../../model/prepareDataset/utilities/preProcess";

// Ensure this runs only on the server
export const runtime = "nodejs";

export async function POST(req, res) {
  try {
    const { imagePath } = await req.json(); // Use .json() for Next.js API handler in app directory
    console.log("Image path received:", imagePath);

    if (!imagePath) {
      return new Response(JSON.stringify({ error: "No image path provided" }), {
        status: 400
      });
    }

    // Process the image server-side using TensorFlow Node.js
    const processedImage = await processImage(imagePath);

    return new Response(JSON.stringify({ processedImage }), { status: 200 });
  } catch (err) {
    console.error("Error during image preprocessing:", err);
    return new Response(
      JSON.stringify({ error: "Image preprocessing failed" }),
      { status: 500 }
    );
  }
}
