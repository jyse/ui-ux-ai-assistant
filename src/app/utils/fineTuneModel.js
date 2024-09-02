import * as tf from '@tensorflow/tfjs-node'; // Use tfjs-node for better performance in Node.js
import * as mobilenet from '@tensorflow-models/mobilenet';

// Create the fine-tuned model
async function createFineTunedModel() {
  // Load the MobileNet model without the top layer
  const baseModel = await mobilenet.load({
    version: 2, // You can specify version 1 or 2 of MobileNet
    alpha: 1.0, // Alpha controls the width of the network, 1.0 is the standard size
  });

  const model = tf.sequential();

  // Add the MobileNet model layers, excluding the top layer
  baseModel.layers.slice(0, -1).forEach(layer => {
    layer.trainable = false; // Freeze the weights of these layers
    model.add(layer);
  });

  // Add new layers for our specific task
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.5 })); // Add dropout to prevent overfitting
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 9, activation: 'softmax' })); // 9 outputs for the 9 categories in your dataset

  return model;
}

// Fine-tune the model
async function fineTuneModel(model, trainDataset, valDataset) {
  model.compile({
    optimizer: tf.train.adam(0.0001), // Lower learning rate for fine-tuning
    loss: 'categoricalCrossentropy', // Suitable for multi-class classification
    metrics: ['accuracy'],
  });

  // Train the model
  await model.fitDataset(trainDataset, {
    epochs: 10,
    batchSize: 32,
    validationData: valDataset,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch + 1}: Loss = ${logs.loss}, Accuracy = ${logs.acc}`);
      }
    }
  });

  return model;
}

// Main function to create and fine-tune the model
export async function createAndFineTuneModel(trainDataset, valDataset) {
  const model = await createFineTunedModel();
  const fineTunedModel = await fineTuneModel(model, trainDataset, valDataset);
  return fineTunedModel;
}
