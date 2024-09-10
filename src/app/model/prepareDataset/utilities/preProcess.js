import * as tf from "@tensorflow/tfjs";
import sharp from "sharp";
import fs from "fs";

// Resize and normalize image
export const processImage = async (imagePath) => {
  const buffer = fs.readFileSync(imagePath);

  // Resize image to 224x224 and normalize values
  const processedImage = await sharp(buffer).resize(224, 224).raw().toBuffer();

  // Convert the image to a tensor (3 channels - RGB)
  const imageTensor = tf.tensor3d(
    new Uint8Array(processedImage),
    [224, 224, 3]
  );

  // Normalize values from 0-255 to 0-1
  const normalizedTensor = imageTensor.div(tf.scalar(255));

  return normalizedTensor;
};

