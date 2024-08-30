import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// Configuration
const CONFIG = {
  datasetPath: path.join(__dirname, '..', '..', 'figma_components'),
  imageSize: [224, 224],
  trainRatio: 0.8,
  batchSize: 32,
  predefinedCategories: ['layouts', 'color_schemes', 'usability', 'ui_components']
};

// Utility Functions
const sanitizeFilename = (filename) => filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
const truncateName = (name, maxLength = 20) => name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;

// Image Processing Functions
async function loadImage(imagePath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const tfImage = tf.node.decodeImage(imageBuffer);
    return tfImage.resizeBilinear(CONFIG.imageSize).toFloat().div(tf.scalar(255));
  } catch (error) {
    console.error(`Error loading image ${imagePath}:`, error.message);
    return null;
  }
}

// File System Functions
async function getAllFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const res = path.resolve(dirPath, entry.name);
    return entry.isDirectory() ? getAllFiles(res) : res;
  }));
  return files.flat();
}

// Dataset Preparation Functions
async function prepareDataset() {
  const images = [];
  const labels = [];
  const labelMap = Object.fromEntries(CONFIG.predefinedCategories.map(cat => [cat, []]));
  labelMap.other = [];

  const allFiles = await getAllFiles(CONFIG.datasetPath);
  const pngFiles = allFiles.filter(file => path.extname(file).toLowerCase() === '.png');

  for (const file of pngFiles) {
    const image = await loadImage(file);
    if (!image) continue;

    images.push(image);
    const sanitizedFilename = sanitizeFilename(path.basename(file));
    let categoryFound = false;

    for (let catIndex = 0; catIndex < CONFIG.predefinedCategories.length; catIndex++) {
      const category = CONFIG.predefinedCategories[catIndex];
      if (sanitizedFilename.includes(sanitizeFilename(category))) {
        labels.push(tf.oneHot(catIndex, CONFIG.predefinedCategories.length + 1));
        const subcategory = truncateName(sanitizedFilename.split('_')[0]);
        if (!labelMap[category].includes(subcategory)) {
          labelMap[category].push(subcategory);
        }
        categoryFound = true;
        break;
      }
    }

    if (!categoryFound) {
      labels.push(tf.oneHot(CONFIG.predefinedCategories.length, CONFIG.predefinedCategories.length + 1));
      const subcategory = truncateName(sanitizedFilename.split('_')[0]);
      if (!labelMap.other.includes(subcategory)) {
        labelMap.other.push(subcategory);
      }
    }
  }

  return { xs: tf.stack(images), ys: tf.stack(labels), labelMap };
}

function splitData(xs, ys) {
  const numExamples = xs.shape[0];
  const numTrainExamples = Math.round(numExamples * CONFIG.trainRatio);
  
  const trainXs = xs.slice([0, 0, 0, 0], [numTrainExamples, -1, -1, -1]);
  const trainYs = ys.slice([0, 0], [numTrainExamples, -1]);
  
  const valXs = xs.slice([numTrainExamples, 0, 0, 0], [-1, -1, -1, -1]);
  const valYs = ys.slice([numTrainExamples, 0], [-1, -1]);
  
  return { trainXs, trainYs, valXs, valYs };
}

function createDataset(xs, ys) {
  return tf.data.zip({xs: tf.data.dataset(xs), ys: tf.data.dataset(ys)})
    .shuffle(1000)
    .batch(CONFIG.batchSize);
}

// Main Function
export async function getDataset() {
  console.log('Preparing dataset... 🐛');
  const { xs, ys, labelMap } = await prepareDataset();
  console.log('Dataset prepared.');

  console.log('Splitting data into training and validation sets...');
  const { trainXs, trainYs, valXs, valYs } = splitData(xs, ys);
  console.log('Data split complete.');

  console.log('Creating TensorFlow datasets...');
  const trainDataset = createDataset(trainXs, trainYs);
  const valDataset = createDataset(valXs, valYs);
  console.log('TensorFlow datasets created.');

  return { trainDataset, valDataset, labelMap };
}

console.log("SCRIPT STARTING!!")
// Script Execution
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("GETTING DATASET")
  getDataset().then(({ trainDataset, valDataset, labelMap }) => {
    console.log('Label Map:', labelMap);
    console.log('Training Dataset:', trainDataset);
    console.log('Validation Dataset:', valDataset);
  }).catch(error => {
    console.error('Error in dataset preparation:', error);
  });
}