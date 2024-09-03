import * as tf from "@tensorflow/tfjs-node";
import fs from "fs";
import path from "path";

// Code Overview:
// Load and preprocess images from your dataset.
// Organize images and labels into tensors (xs and ys).
// Split the dataset into training and validation sets.
// Return the datasets for training.

// Function to load and preprocess an image
async function loadImage(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const tfImage = tf.node.decodeImage(imageBuffer);
  return tfImage.resizeBilinear([224, 224]).toFloat().div(tf.scalar(255));
}

// Function to get all subdirectories in a directory
function getSubdirectories(directoryPath) {
  return fs
    .readdirSync(directoryPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

// Main function to prepare the dataset
async function prepareDataset() {
  const datasetPath = "path/to/your/dataset";
  const categories = ["layouts", "color_schemes", "usability", "ui_components"];

  let images = [];
  let labels = [];
  let labelMap = {};

  for (let catIndex = 0; catIndex < categories.length; catIndex++) {
    const category = categories[catIndex];
    const categoryPath = path.join(datasetPath, category);
    const subCategories = getSubdirectories(categoryPath);

    labelMap[category] = subCategories;

    for (
      let subCatIndex = 0;
      subCatIndex < subCategories.length;
      subCatIndex++
    ) {
      const subCategory = subCategories[subCatIndex];
      const subCategoryPath = path.join(categoryPath, subCategory);
      const files = fs
        .readdirSync(subCategoryPath)
        .filter((file) => file.endsWith(".png") || file.endsWith(".jpg"));

      for (const file of files) {
        const imagePath = path.join(subCategoryPath, file);
        const image = await loadImage(imagePath);
        images.push(image);

        const label = tf.oneHot(subCatIndex, subCategories.length);
        labels.push(label);
      }
    }
  }

  const xs = tf.stack(images);
  const ys = tf.stack(labels);

  return { xs, ys, labelMap };
}

// Function to split data into training and validation sets
function splitData(xs, ys, trainRatio = 0.8) {
  const numExamples = xs.shape[0];
  const numTrainExamples = Math.round(numExamples * trainRatio);

  const trainXs = xs.slice([0, 0, 0, 0], [numTrainExamples, -1, -1, -1]);
  const trainYs = ys.slice([0, 0], [numTrainExamples, -1]);

  const valXs = xs.slice([numTrainExamples, 0, 0, 0], [-1, -1, -1, -1]);
  const valYs = ys.slice([numTrainExamples, 0], [-1, -1]);

  return { trainXs, trainYs, valXs, valYs };
}

// Function to create TensorFlow dataset
function createDataset(xs, ys, batchSize = 32) {
  return tf.data
    .zip({ xs: tf.data.dataset(xs), ys: tf.data.dataset(ys) })
    .shuffle(1000)
    .batch(batchSize);
}

// Main function to get the prepared dataset
export async function getDataset(batchSize = 32) {
  console.log("Preparing dataset...");
  const { xs, ys, labelMap } = await prepareDataset();
  console.log("Dataset prepared.");

  console.log("Splitting data into training and validation sets...");
  const { trainXs, trainYs, valXs, valYs } = splitData(xs, ys);
  console.log("Data split complete.");

  console.log("Creating TensorFlow datasets...");
  const trainDataset = createDataset(trainXs, trainYs, batchSize);
  const valDataset = createDataset(valXs, valYs, batchSize);
  console.log("TensorFlow datasets created.");

  return { trainDataset, valDataset, labelMap };
}

// If you want to test the script
if (require.main === module) {
  getDataset()
    .then(({ trainDataset, valDataset, labelMap }) => {
      console.log("Label Map:", labelMap);
      console.log("Training Dataset:", trainDataset);
      console.log("Validation Dataset:", valDataset);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}
