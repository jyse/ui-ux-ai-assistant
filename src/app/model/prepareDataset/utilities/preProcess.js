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

// Process dataset for training (returns a list of tensors and their corresponding labels)
export const preprocessDataset = async (imagePaths, metadata) => {
  const processedData = [];

  for (const imagePath of imagePaths) {
    try {
      const imageTensor = await processImage(imagePath); // Preprocess each image
      const contrastLabel = metadata[imagePath]; // Assuming metadata has contrast info
      processedData.push({ image: imageTensor, label: contrastLabel }); // Store processed image and its label
    } catch (err) {
      console.error(`Failed to process image ${imagePath}:`, err);
    }
  }

  return processedData;
};
