import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data Augmentation Function
function augmentData(image) {
  // Random brightness adjustment
  const brightness = tf.randomUniform([], -0.2, 0.2);
  let augmented = image.add(brightness).clipByValue(0, 1);
  
  // Random horizontal flip
  if (tf.randomUniform([], 0, 1) > 0.5) {
    augmented = tf.image.flipLeftRight(augmented);
  }
  
  return augmented;
}

async function loadPreprocessedData() {
  const dataPathHighContrast = path.join(__dirname, '..', 'prepareDataset', 'processed_high_contrast.json');
  const dataPathLowContrast = path.join(__dirname, '..', 'prepareDataset', 'processed_low_contrast.json');

  const rawDataHighContrast = JSON.parse(fs.readFileSync(dataPathHighContrast, 'utf8'));
  const rawDataLowContrast = JSON.parse(fs.readFileSync(dataPathLowContrast, 'utf8'));

  const xsHighContrast = tf.tensor4d(rawDataHighContrast.flat(), [rawDataHighContrast.length, 224, 224, 3]);
  const xsLowContrast = tf.tensor4d(rawDataLowContrast.flat(), [rawDataLowContrast.length, 224, 224, 3]);

  const xs = tf.concat([xsHighContrast, xsLowContrast]);
  
  // Apply data augmentation
  const augmentedXs = tf.tidy(() => {
    const brightness = tf.randomUniform([xs.shape[0], 1, 1, 1], -0.2, 0.2);
    const brightened = xs.add(brightness).clipByValue(0, 1);
    
    const flipped = tf.image.flipLeftRight(brightened);
    
    // Randomly choose between original, brightened, and flipped
    const random = tf.randomUniform([xs.shape[0], 1, 1, 1]);
    const threshold1 = tf.fill([xs.shape[0], 1, 1, 1], 0.33);
    const threshold2 = tf.fill([xs.shape[0], 1, 1, 1], 0.66);
    
    const condition1 = tf.less(random, threshold1);
    const condition2 = tf.logicalAnd(tf.greaterEqual(random, threshold1), tf.less(random, threshold2));
    
    return tf.where(condition1, xs, tf.where(condition2, brightened, flipped));
  });

  const ysHighContrast = tf.oneHot(tf.ones([rawDataHighContrast.length], 'int32'), 2);
  const ysLowContrast = tf.oneHot(tf.zeros([rawDataLowContrast.length], 'int32'), 2);
  const ys = tf.concat([ysHighContrast, ysLowContrast]);

  return { xs: augmentedXs, ys };
}

async function loadAndModifyMobileNet() {
  console.log('Loading MobileNetV1 model...');
  const mobilenet = await tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_1.0_224/model.json');
  const layer = mobilenet.getLayer('conv_preds');
  const truncatedMobilenet = tf.model({ inputs: mobilenet.inputs, outputs: layer.output });
  truncatedMobilenet.trainable = false;
  return truncatedMobilenet;
}

function createModel(baseModel, numClasses) {
  const model = tf.sequential();
  model.add(baseModel);
  model.add(tf.layers.globalAveragePooling2d({}));
  model.add(tf.layers.dense({ units: 256, activation: 'relu' }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.5 }));
  model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
  return model;
}

async function trainModel(model, xs, ys) {
  const learningRate = 0.001;
  const decay = learningRate / 200;
  const optimizer = tf.train.adam(learningRate, 0.9, 0.999, undefined, decay);

  model.compile({
    optimizer: optimizer,
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  console.log('Fine-tuning the model...');
  
  const history = [];
  
  const trainedModel = await model.fit(xs, ys, {
    epochs: 50,
    batchSize: 32,
    validationSplit: 0.2,
    callbacks: [
      tf.callbacks.earlyStopping({ monitor: 'val_loss', patience: 5 }),
      {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}, val_accuracy = ${logs.val_acc.toFixed(4)}`);
          history.push(logs);
        }
      }
    ]
  });

  // Save training history to a file
  const historyPath = path.join(__dirname, 'training_history.json');
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  console.log(`Training history saved to ${historyPath}`);

  return trainedModel;
}

async function main() {
  console.log('Loading preprocessed data...');
  const { xs, ys } = await loadPreprocessedData();
  console.log(`Data loaded - xs shape: ${xs.shape}, ys shape: ${ys.shape}`);

  const baseModel = await loadAndModifyMobileNet();
  const model = createModel(baseModel, 2);

  const { model: trainedModel, history } = await trainModel(model, xs, ys);

  const savedModelPath = path.join(__dirname, 'trained_model');
  await trainedModel.save(`file://${savedModelPath}`);
  console.log(`Model training complete and saved to ${savedModelPath}`);

  // Save training history
  fs.writeFileSync(path.join(__dirname, 'training_history.json'), JSON.stringify(history));

  // Cleanup
  xs.dispose();
  ys.dispose();
  trainedModel.dispose();
}

main().catch(console.error);