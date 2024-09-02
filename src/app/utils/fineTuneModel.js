import * as tf from '@tensorflow/tfjs-node';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { getDataset } from './prepareData.js';

console.log('Starting fine-tuning process...');

async function createFineTunedModel() {
  try {
    console.log('Loading MobileNet model...');
    const baseModel = await mobilenet.load({
      version: 2,
      alpha: 1.0,
    });
    console.log('MobileNet model loaded.');
    console.log('MobileNet Expected Input Shape:', [224, 224, 3]);

    // Define input tensor
    const inputs = tf.input({ shape: [224, 224, 3] });

    // Use the `infer` method instead of `predict`
    const baseModelOutputs = baseModel.infer(inputs, { pooling: 'avg' });

    // Add custom layers on top of MobileNet
    const flatten = tf.layers.flatten().apply(baseModelOutputs);
    const dense1 = tf.layers.dense({ units: 128, activation: 'relu' }).apply(flatten);
    const dropout = tf.layers.dropout({ rate: 0.5 }).apply(dense1);
    const dense2 = tf.layers.dense({ units: 64, activation: 'relu' }).apply(dropout);
    const outputs = tf.layers.dense({ units: 9, activation: 'softmax' }).apply(dense2);

    // Create the final model
    const model = tf.model({ inputs: inputs, outputs: outputs });
    console.log('Custom layers added.');

    return model;
  } catch (error) {
    console.error('Error during model creation:', error);
    throw error;
  }
}

async function fineTuneModel(model, trainDataset, valDataset) {
  try {
    console.log('Compiling the model...');
    model.compile({
      optimizer: tf.train.adam(0.0001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });
    console.log('Model compiled.');

    console.log('Starting model training...');
    await model.fitDataset(trainDataset, {
      epochs: 10,
      batchSize: 32,
      validationData: valDataset,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1} completed: Loss = ${logs.loss.toFixed(4)}, Accuracy = ${(logs.acc * 100).toFixed(2)}%`);
        }
      }
    });
    console.log('Model training completed.');

    return model;
  } catch (error) {
    console.error('Error during model fine-tuning:', error);
    throw error;
  }
}

export async function createAndFineTuneModel(trainDataset, valDataset) {
  try {
    console.log('Creating and fine-tuning the model...');
    const model = await createFineTunedModel();
    const fineTunedModel = await fineTuneModel(model, trainDataset, valDataset);
    console.log('Model fine-tuning completed.');
    return fineTunedModel;
  } catch (error) {
    console.error('Error in the fine-tuning process:', error);
  }
}

(async () => {
  try {
    const { trainDataset, valDataset } = await getDataset();
    await createAndFineTuneModel(trainDataset, valDataset);
  } catch (error) {
    console.error('Error during fine-tuning process:', error);
  }
})();
