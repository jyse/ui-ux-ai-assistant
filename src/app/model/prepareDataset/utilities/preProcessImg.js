import * as tf from "@tensorflow/tfjs-node";
import sharp from "sharp";

export async function processImage(imagePath) {
  // Read the image file
  const imageBuffer = await sharp(imagePath)
    .resize(224, 224, { fit: "cover" })
    .toBuffer();

  // Convert the image to a tensor
  const tfimage = tf.node.decodeImage(imageBuffer, 3);

  // Normalize the image
  const normalized = tfimage.toFloat().div(tf.scalar(255));

  // Expand dimensions to match the model's expected input shape
  return normalized.expandDims();
}
