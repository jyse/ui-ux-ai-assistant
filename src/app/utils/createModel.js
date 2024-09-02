import * as tf from '@tensorflow/tfjs-node';

export function createModel() {
  const model = tf.sequential();
  model.add(tf.layers.conv2d({
    inputShape: [224, 224, 3],
    filters: 32,
    kernelSize: 3,
    activation: 'relu',
  }));
  model.add(tf.layers.maxPooling2d({poolSize: 2, strides: 2}));
  // Add more layers as needed
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({units: 64, activation: 'relu'}));
  model.add(tf.layers.dense({units: 5, activation: 'softmax'})); // 5 output classes

  return model;
}