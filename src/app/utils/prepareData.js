import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Script started');

// Configuration
const CONFIG = {
  datasetPath: path.join(__dirname, '..', '..', 'figma_components'),
  imageSize: [224, 224],
  trainRatio: 0.8,
  batchSize: 8,
  categories: {
    layouts: ['balanced', 'asymmetric', 'cluttered'],
    color_schemes: ['harmonious', 'contrasting', 'monotonous'],
    usability: ['good', 'average', 'poor'],
    ui_components: ['buttons', 'forms', 'navigation']
  }
};

console.log('Configuration set:', CONFIG);

// Image Processing Functions
async function loadImage(imagePath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    let tfImage;
    
    if (imagePath.toLowerCase().endsWith('.png')) {
      tfImage = tf.node.decodePng(imageBuffer, 3); // Force 3 channels
    } else if (imagePath.toLowerCase().endsWith('.jpg') || imagePath.toLowerCase().endsWith('.jpeg')) {
      tfImage = tf.node.decodeJpeg(imageBuffer, 3); // Force 3 channels
    } else {
      console.warn(`Unsupported image format for file: ${imagePath}`);
      return null;
    }
    
    const resizedImage = tf.image.resizeBilinear(tfImage, CONFIG.imageSize);
    const normalizedImage = resizedImage.toFloat().div(tf.scalar(255));
    
    console.log(`Successfully loaded image: ${imagePath}`);
    console.log(`Image shape: ${normalizedImage.shape}`);
    return normalizedImage;
  } catch (error) {
    console.warn(`Error loading image ${imagePath}: ${error.message}`);
    return null;
  }
}

// File System Functions
async function getAllFiles(dirPath) {
  console.log(`Scanning directory: ${dirPath}`);
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = await Promise.all(entries.map((entry) => {
      const res = path.resolve(dirPath, entry.name);
      return entry.isDirectory() ? getAllFiles(res) : res;
    }));
    return files.flat();
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
    return [];
  }
}

// Labeling Function
function getLabelFromFilepath(filepath) {
  const category = path.basename(path.dirname(filepath)); // Get the category (e.g., 'balanced', 'harmonious')
  const mainCategory = path.basename(path.dirname(path.dirname(filepath))); // Get the main category (e.g., 'layouts', 'color_schemes')

  const categoryIndex = CONFIG.categories[mainCategory].indexOf(category);
  const mainCategoryIndex = Object.keys(CONFIG.categories).indexOf(mainCategory);

  if (mainCategoryIndex >= 0 && categoryIndex >= 0) {
    const labelArray = new Array(Object.keys(CONFIG.categories).length).fill(0);
    labelArray[mainCategoryIndex] = 1; // One-hot encoding for the main category

    return tf.tensor1d(labelArray, 'int32');
  } else {
    console.warn(`Unable to assign label for file: ${filepath}`);
    return null;
  }
}

// Data Generator
async function* dataGenerator(files, batchSize) {
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const images = [];
    const labels = [];
    
    for (const file of batch) {
      const image = await loadImage(file);
      const label = getLabelFromFilepath(file);
      
      if (image && label) {
        images.push(image);
        labels.push(label);
      } else {
        console.warn(`Skipping file due to loading or labeling issue: ${file}`);
      }
    }
    
    if (images.length > 0) {
      yield {
        xs: tf.stack(images),
        ys: tf.stack(labels)
      };
    }

    console.log('Memory usage:', tf.memory().numBytes, 'bytes');
  }
}

// Dataset Preparation Function
async function prepareDataset() {
  console.log('Preparing dataset...');
  const allFiles = await getAllFiles(CONFIG.datasetPath);
  const validImageFiles = allFiles.filter(file => 
    file.toLowerCase().endsWith('.png') || 
    file.toLowerCase().endsWith('.jpg') || 
    file.toLowerCase().endsWith('.jpeg')
  );
  console.log(`Valid image files found: ${validImageFiles.length}`);

  const numTrainExamples = Math.round(validImageFiles.length * CONFIG.trainRatio);
  const trainFiles = validImageFiles.slice(0, numTrainExamples);
  const valFiles = validImageFiles.slice(numTrainExamples);

  const trainGenerator = dataGenerator(trainFiles, CONFIG.batchSize);
  const valGenerator = dataGenerator(valFiles, CONFIG.batchSize);

  return {
    trainDataset: tf.data.generator(async function* () {
      try {
        for await (const batch of trainGenerator) {
          yield batch;
        }
      } catch (error) {
        console.error('Error in train data generator:', error);
      }
    }),
    valDataset: tf.data.generator(async function* () {
      try {
        for await (const batch of valGenerator) {
          yield batch;
        }
      } catch (error) {
        console.error('Error in validation data generator:', error);
      }
    }),
    numTrainExamples,
    numValExamples: validImageFiles.length - numTrainExamples
  };
}

// Main Function
export async function getDataset() {
  console.log('getDataset function called');
  try {
    const { trainDataset, valDataset, numTrainExamples, numValExamples } = await prepareDataset();
    console.log('Dataset prepared successfully.');
    console.log(`Training examples: ${numTrainExamples}, Validation examples: ${numValExamples}`);
    return { trainDataset, valDataset };
  } catch (error) {
    console.error('Error in dataset preparation:', error);
    throw error;
  }
}

// Script Execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log("Starting dataset preparation...");
  getDataset().then(({ trainDataset, valDataset }) => {
    console.log('Dataset preparation completed successfully');
    console.log('Training Dataset:', trainDataset);
    console.log('Validation Dataset:', valDataset);
  }).catch(error => {
    console.error('Error in dataset preparation:', error);
  });
} else {
  console.log("Module imported, not running dataset preparation.");
}

console.log('Script execution check complete');
