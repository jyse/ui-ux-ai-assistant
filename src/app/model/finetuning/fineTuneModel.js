import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load preprocessed data from separate high/low contrast files
async function loadPreprocessedData() {
  const dataPathHighContrast = path.join(__dirname, '..', 'prepareDataset', 'processed_high_contrast.json');
  const dataPathLowContrast = path.join(__dirname, '..', 'prepareDataset', 'processed_low_contrast.json');

  // Load both high and low contrast data
  const rawDataHighContrast = JSON.parse(fs.readFileSync(dataPathHighContrast, 'utf8'));
  const rawDataLowContrast = JSON.parse(fs.readFileSync(dataPathLowContrast, 'utf8'));

  // Ensure data is flat/TypedArray before converting to tensors
  const xsHighContrast = tf.tensor4d(rawDataHighContrast.flat(), [rawDataHighContrast.length, 224, 224, 3]);
  const xsLowContrast = tf.tensor4d(rawDataLowContrast.flat(), [rawDataLowContrast.length, 224, 224, 3]);

  const xs = tf.concat([xsHighContrast, xsLowContrast]);

  // Convert ys to one-hot encoded format
  const ysHighContrast = tf.oneHot(tf.ones([rawDataHighContrast.length], 'int32'), 2);
  const ysLowContrast = tf.oneHot(tf.zeros([rawDataLowContrast.length], 'int32'), 2);

  const ys = tf.concat([ysHighContrast, ysLowContrast]);

  return { xs, ys };
}

// Load and modify MobileNet model
async function loadAndModifyMobileNet() {
  console.log('Loading MobileNetV1 model...');
  const mobilenet = await tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_1.0_224/model.json');
  const layer = mobilenet.getLayer('conv_preds');
  const truncatedMobilenet = tf.model({ inputs: mobilenet.inputs, outputs: layer.output });
  
  // Freeze all layers to prevent further training
  truncatedMobilenet.layers.forEach(layer => layer.trainable = false);

  return truncatedMobilenet;
}

// Create custom model by adding layers on top of MobileNet
function createModel(baseModel, numClasses) {
  const model = tf.sequential();
  model.add(baseModel);
  model.add(tf.layers.globalAveragePooling2d({}));
  model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.5 }));
  model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' })); // Ensure units is set to numClasses
  return model;
}

// Train the model
async function trainModel(model, xs, ys) {
  model.compile({
    optimizer: tf.train.adam(),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  console.log('Fine-tuning the model...');
  await model.fit(xs, ys, {
    epochs: 10,
    validationSplit: 0.2,
    callbacks: tf.callbacks.earlyStopping({ monitor: 'val_loss', patience: 3 })
  });

  return model;
}

// Main function to load data, fine-tune model, and save
async function main() {
  console.log('Loading preprocessed data...');
  const { xs, ys } = await loadPreprocessedData();
  console.log(`Data loaded - xs shape: ${xs.shape}, ys shape: ${ys.shape}`);

  const baseModel = await loadAndModifyMobileNet();
  const model = createModel(baseModel, 2); // Binary classification (high/low contrast)

  const trainedModel = await trainModel(model, xs, ys);

  const savedModelPath = path.join(__dirname, 'trained_model');
  await trainedModel.save(`file://${savedModelPath}`);
  console.log(`Model training complete and saved to ${savedModelPath}`);

  // Clean up
  xs.dispose();
  ys.dispose();
  trainedModel.dispose();
}

// Execute the main function
main().catch(console.error);
