import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadPreprocessedData() {
  const dataPath = path.join(__dirname, '..', 'prepareDataset', 'preprocessed_data.json');
  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const xs = tf.tensor(rawData.xs, rawData.xsShape);
  const ys = tf.tensor(rawData.ys, rawData.ysShape);
  return { xs, ys };
}

async function loadAndModifyMobileNet() {
  console.log('Loading MobileNetV1 model...');
  const mobilenet = await tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_1.0_224/model.json');
  const layer = mobilenet.getLayer('conv_preds');
  const truncatedMobilenet = tf.model({inputs: mobilenet.inputs, outputs: layer.output});
  for (const layer of truncatedMobilenet.layers) {
    layer.trainable = false;
  }
  return truncatedMobilenet;
}

function createModel(baseModel, numClasses) {
  const model = tf.sequential();
  model.add(baseModel);
  model.add(tf.layers.globalAveragePooling2d({}));
  model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.5 }));
  model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
  return model;
}

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

async function main() {
  console.log('Loading preprocessed data...');
  const { xs, ys } = await loadPreprocessedData();
  console.log(`Data loaded - xs shape: ${xs.shape}, ys shape: ${ys.shape}`);

  const baseModel = await loadAndModifyMobileNet();
  const model = createModel(baseModel, ys.shape[1]);

  const trainedModel = await trainModel(model, xs, ys);

  const savedModelPath = path.join(__dirname, 'trained_model');
  await trainedModel.save(`file://${savedModelPath}`);
  console.log(`Model training complete and saved to ${savedModelPath}`);

  // Clean up
  xs.dispose();
  ys.dispose();
  trainedModel.dispose();
}

main().catch(console.error);