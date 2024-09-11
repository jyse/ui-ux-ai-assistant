import { processImage } from "../../model/prepareDataset/utilities/preProcessImg.js";
import * as tf from "@tensorflow/tfjs-node";
import path from "path";
import { promises as fs } from "fs";
import os from "os";
import crypto from "crypto";

export const runtime = "nodejs";

let model;
const loadModel = async () => {
  if (!model) {
    try {
      const modelPath = path.join(
        process.cwd(),
        "src/app/model/finetuning/trained_model"
      );
      model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
      console.log("Model loaded successfully");
    } catch (err) {
      console.error("Error loading model:", err);
      throw err;
    }
  }
  return model;
};

export async function POST(req) {
  try {
    console.log("POST request received");
    const body = await req.json();
    console.log("Request body received");

    const { imageData } = body;

    if (!imageData) {
      console.log("No image data provided");
      return new Response(JSON.stringify({ error: "No image data provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log("Received image data");

    // Create a temporary file
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(
      tempDir,
      `temp-${crypto.randomBytes(16).toString("hex")}.png`
    );

    console.log("Temporary file path:", tempFilePath);

    // Decode base64 and save to temporary file
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    await fs.writeFile(tempFilePath, buffer);

    console.log("Image saved to temporary file");

    const preprocessedImage = await processImage(tempFilePath);
    console.log("Image preprocessed successfully");

    const model = await loadModel();
    console.log("Model loaded");

    const predictions = model.predict(preprocessedImage);
    console.log("Prediction made");

    const predictionIndex = predictions.argMax(-1).dataSync()[0];
    const result = predictionIndex === 1 ? "High Contrast" : "Low Contrast";

    console.log("Prediction result:", result);

    // Clean up: delete the temporary file
    await fs.unlink(tempFilePath);
    console.log("Temporary file deleted");

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Error during prediction:", err);
    console.error(err.stack);

    return new Response(
      JSON.stringify({
        error: "Prediction failed",
        message: err.message,
        stack: err.stack
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
