import * as tf from "@tensorflow/tfjs-node";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Recursively read through all subdirectories to gather images
function getAllImagePaths(dirPath) {
  let imagePaths = [];

  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      imagePaths = imagePaths.concat(getAllImagePaths(filePath));
    } else if (filePath.endsWith(".png") || filePath.endsWith(".jpg")) {
      imagePaths.push(filePath);
    }
  }

  return imagePaths;
}

// Load and preprocess an image
export async function processImage(imagePath) {
  try {
    console.log(`Processing image: ${imagePath}`);

    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);

    // Decode the image buffer into a tensor
    let tfImage = tf.node.decodeImage(imageBuffer);

    // If the image has 4 channels (RGBA), remove the alpha channel
    if (tfImage.shape[2] === 4) {
      tfImage = tfImage.slice([0, 0, 0], [-1, -1, 3]);
    }

    // Resize the image and normalize pixel values (0-1)
    const processedImage = tfImage
      .resizeBilinear([224, 224])
      .toFloat()
      .div(tf.scalar(255))
      .expandDims(0); // Add a batch dimension

    return processedImage;
  } catch (error) {
    console.error(`Error processing image ${imagePath}:`, error.message);
    return null;
  }
}

// Save processed data to file
function saveProcessedData(data, outputFilePath) {
  const processedDataArray = data.map((imageTensor) => imageTensor.arraySync());
  fs.writeFileSync(outputFilePath, JSON.stringify(processedDataArray));
  console.log(`Processed data saved to: ${outputFilePath}`);
}

// Function to preprocess and save the dataset
export async function preprocessMasterDataset(datasetPath, outputFileName) {
  const datasetDir = path.resolve(__dirname, datasetPath);
  const imageFiles = getAllImagePaths(datasetDir);
  const processedImages = [];

  for (const file of imageFiles) {
    const processedImage = await processImage(file);

    if (processedImage) {
      processedImages.push(processedImage);
    }
  }

  // Combine images into a single tensor (optional step)
  const xs = tf.concat(processedImages);

  // Save the processed images to a file
  const outputFilePath = path.join(__dirname, outputFileName);
  saveProcessedData(processedImages, outputFilePath);

  return xs;
}

// If you want to run this file independently, you can add a main function
async function main() {
  console.log("Preprocessing high contrast dataset...");
  await preprocessMasterDataset(
    "../../../../../data/master_dataset/high_contrast",
    "processed_high_contrast.json"
  );

  console.log("Preprocessing low contrast dataset...");
  await preprocessMasterDataset(
    "../../../../../data/master_dataset/low_contrast",
    "processed_low_contrast.json"
  );
}

// Run the main function if this script is executed directly
main().catch((err) =>
  console.error("An error occurred during preprocessing:", err)
);
