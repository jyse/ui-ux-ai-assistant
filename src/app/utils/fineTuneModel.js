import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

async function createFineTunedModel() {
  const baseModel = await mobilenet.load();
  
  const model = tf.sequential();
  
  // Add the MobileNet model layers, excluding the top layer
  baseModel.layers.slice(0, -1).forEach(layer => {
    layer.trainable = false;  // Freeze the weights of these layers
    model.add(layer);
  });
  
  // Add new layers for our specific task
  model.add(tf.layers.dense({units: 64, activation: 'relu'}));
  model.add(tf.layers.dense({units: 3, activation: 'softmax'}));  // 3 outputs for layout, color scheme, usability
  
  return model;
}

// Fine-tune the model
async function fineTuneModel(model, dataset) {
  model.compile({
    optimizer: tf.train.adam(0.0001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
  
  await model.fit(dataset.xs, dataset.ys, {
    epochs: 10,
    batchSize: 32,
    validationSplit: 0.2
  });
  
  return model;
}

// Main function to create and fine-tune the model
export async function createAndFineTuneModel(dataset) {
  const model = await createFineTunedModel();
  const fineTunedModel = await fineTuneModel(model, dataset);
  return fineTunedModel;
}