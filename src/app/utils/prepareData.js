import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-node';  // This line loads the binding
import fs from 'fs';
import path from 'path';

// Function to load and preprocess an image
async function loadImage(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const tfImage = tf.node.decodeImage(imageBuffer);
  return tfImage.resizeBilinear([224, 224]).toFloat().div(tf.scalar(255));
}

// Function to get all files in a directory and its subdirectories
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

// Function to sanitize filename (similar to figmaFetcher.js)
function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// Function to truncate long names
function truncateName(name, maxLength = 20) {
  return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
}

// Main function to prepare the dataset
async function prepareDataset() {
  const datasetPath = './figma_components'; // Update this path if necessary
  const predefinedCategories = ['layouts', 'color_schemes', 'usability', 'ui_components'];
  
  let images = [];
  let labels = [];
  let labelMap = {};

  const allFiles = getAllFiles(datasetPath);
  const pngFiles = allFiles.filter(file => file.toLowerCase().endsWith('.png'));

  // Initialize labelMap with predefined categories
  predefinedCategories.forEach(category => {
    labelMap[category] = [];
  });

  // Add an "other" category for files that don't match predefined categories
  labelMap['other'] = [];

  for (const file of pngFiles) {
    try {
      const image = await loadImage(file);
      images.push(image);

      const sanitizedFilename = sanitizeFilename(path.basename(file));
      let categoryFound = false;

      for (let catIndex = 0; catIndex < predefinedCategories.length; catIndex++) {
        const category = predefinedCategories[catIndex];
        if (sanitizedFilename.includes(sanitizeFilename(category))) {
          const label = tf.oneHot(catIndex, predefinedCategories.length + 1); // +1 for "other" category
          labels.push(label);

          // Extract and truncate subcategory from filename
          const subcategory = truncateName(sanitizedFilename.split('_')[0]);
          if (!labelMap[category].includes(subcategory)) {
            labelMap[category].push(subcategory);
          }

          categoryFound = true;
          break;
        }
      }

      if (!categoryFound) {
        // File doesn't match any predefined category, assign to "other"
        const label = tf.oneHot(predefinedCategories.length, predefinedCategories.length + 1);
        labels.push(label);

        const subcategory = truncateName(sanitizedFilename.split('_')[0]);
        if (!labelMap['other'].includes(subcategory)) {
          labelMap['other'].push(subcategory);
        }
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error.message);
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
  return tf.data.zip({xs: tf.data.dataset(xs), ys: tf.data.dataset(ys)})
    .shuffle(1000)
    .batch(batchSize);
}

// Main function to get the prepared dataset
export async function getDataset(batchSize = 32) {
  console.log('Preparing dataset...');
  const { xs, ys, labelMap } = await prepareDataset();
  console.log('Dataset prepared.');

  console.log('Splitting data into training and validation sets...');
  const { trainXs, trainYs, valXs, valYs } = splitData(xs, ys);
  console.log('Data split complete.');

  console.log('Creating TensorFlow datasets...');
  const trainDataset = createDataset(trainXs, trainYs, batchSize);
  const valDataset = createDataset(valXs, valYs, batchSize);
  console.log('TensorFlow datasets created.');

  return { trainDataset, valDataset, labelMap };
}

// If you want to test the script
if (import.meta.url === `file://${process.argv[1]}`) {
  getDataset().then(({ trainDataset, valDataset, labelMap }) => {
    console.log('Label Map:', labelMap);
    console.log('Training Dataset:', trainDataset);
    console.log('Validation Dataset:', valDataset);
  }).catch(error => {
    console.error('Error:', error);
  });
}