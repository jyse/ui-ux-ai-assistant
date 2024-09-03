import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs';
import path from 'path';

console.log('Script loaded');

// Function to sanitize filenames
function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// Function to read and parse metadata
function readMetadata(metadataPath) {
  console.log(`Reading metadata from: ${metadataPath}`);
  const rawData = fs.readFileSync(metadataPath);
  return JSON.parse(rawData);
}

// Function to load and preprocess an image
async function loadImage(imagePath) {
  try {
    console.log(`Loading image: ${imagePath}`);
    const imageBuffer = fs.readFileSync(imagePath);
    let tfImage = tf.node.decodeImage(imageBuffer);

    // Remove alpha channel if present
    if (tfImage.shape[2] === 4) {
      tfImage = tfImage.slice([0, 0, 0], [-1, -1, 3]);
    }

    // Ensure the image has 4 dimensions: [batch_size, height, width, channels]
    return tfImage.resizeBilinear([224, 224]).toFloat().div(tf.scalar(255)).expandDims(0);
  } catch (error) {
    console.error(`Error loading image ${imagePath}:`, error.message);
    return null;
  }
}

// Function to categorize component
function categorizeComponent(component) {
  const name = component.name.toLowerCase();
  if (name.includes('button')) return 'button';
  if (name.includes('input') || name.includes('field')) return 'input';
  if (name.includes('nav') || name.includes('menu')) return 'navigation';
  if (name.includes('card') || name.includes('container')) return 'container';
  if (name.includes('icon') || name.includes('image')) return 'visual';
  return 'other';
}

// Function to analyze frame layout
function analyzeFrameLayout(frame) {
  const { width, height } = frame.absoluteBoundingBox;
  if (Math.abs(width - height) < 50) return 'square';
  return width > height ? 'landscape' : 'portrait';
}

// Function to pad the frame layout labels to match the length of component type labels
function padLabel(label, targetLength) {
  const paddingLength = targetLength - label.shape[0];
  if (paddingLength > 0) {
    // Ensure padding tensor is of the same type as the label tensor
    const padding = tf.zeros([paddingLength], label.dtype);
    return tf.concat([label, padding]);
  }
  return label;
}

// Main function to prepare the dataset
async function prepareDataset() {
  console.log('Starting to prepare dataset...');
  const datasetPath = path.resolve(process.cwd(), 'figma_components');
  const metadataPath = path.join(datasetPath, 'metadata.json');
  console.log(`Looking for metadata at: ${metadataPath}`);
  
  let metadata;
  try {
    metadata = readMetadata(metadataPath);
    console.log('Metadata read successfully');
  } catch (error) {
    console.error('Error reading metadata:', error);
    return null;
  }

  let images = [];
  let labels = [];
  let labelMap = {
    componentType: ['button', 'input', 'navigation', 'container', 'visual', 'other'],
    frameLayout: ['square', 'landscape', 'portrait']
  };

  console.log('Processing frames...');
  for (const frame of metadata.frames) {
    const imagePath = path.join(datasetPath, 'frames', `${sanitizeFilename(frame.name)}.png`);
    const image = await loadImage(imagePath);
    if (image) {
      const layoutLabel = analyzeFrameLayout(frame);
      if (layoutLabel !== -1) {
        images.push(image);
        let oneHotLabel = tf.oneHot(labelMap.frameLayout.indexOf(layoutLabel), labelMap.frameLayout.length);
        oneHotLabel = padLabel(oneHotLabel, labelMap.componentType.length);  // Extend the label to match componentType length
        console.log(`Frame label shape: ${oneHotLabel.shape}`);
        labels.push(oneHotLabel);
      } else {
        console.warn(`Invalid frame layout label for image: ${imagePath}`);
      }
    } else {
      console.warn(`Failed to load image: ${imagePath}`);
    }
  }

  console.log('Processing components...');
  for (const component of metadata.components) {
    const imagePath = path.join(datasetPath, 'components', `${sanitizeFilename(component.name)}_${sanitizeFilename(component.parentFrameId)}.png`);
    const image = await loadImage(imagePath);
    if (image) {
      const componentType = categorizeComponent(component);
      if (componentType !== -1) {
        images.push(image);
        const oneHotLabel = tf.oneHot(labelMap.componentType.indexOf(componentType), labelMap.componentType.length);
        console.log(`Component label shape: ${oneHotLabel.shape}`);
        labels.push(oneHotLabel);
      } else {
        console.warn(`Invalid component label for image: ${imagePath}`);
      }
    } else {
      console.warn(`Failed to load image: ${imagePath}`);
    }
  }

  console.log(`Total images processed: ${images.length}`);
  console.log(`Total labels processed: ${labels.length}`);

  if (images.length === 0 || labels.length === 0) {
    console.error('No images or labels processed successfully. Exiting.');
    return null;
  }

  if (images.length !== labels.length) {
    console.error('Mismatch between the number of images and labels. Exiting.');
    return null;
  }

  try {
    const xs = tf.concat(images);
    console.log(`Shape of xs after concatenation: ${xs.shape}`);

    const ys = tf.concat(labels);
    console.log(`Shape of ys after concatenation: ${ys.shape}`);

    // Reshape ys to [labels.length, 6] (since all labels are one-hot encoded with a length of 6)
    const ysReshaped = ys.reshape([labels.length, 6]);
    console.log(`Shape of ys after reshaping: ${ysReshaped.shape}`);

    return { xs, ys: ysReshaped, labelMap };
  } catch (error) {
    console.error('Error during concatenation or reshaping:', error.message);
    return null;
  }
}

// Function to fine-tune MobileNet
async function fineTuneModel(xs, ys, labelMap) {
  console.log('Loading MobileNetV1 model...');
  
  const mobilenet = await tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_1.0_224/model.json');
  
  // Remove the last layer of MobileNetV1 (the classification layer)
  const truncatedMobilenet = tf.model({ inputs: mobilenet.inputs, outputs: mobilenet.layers[mobilenet.layers.length - 4].output });
  
  // Freeze the MobileNetV1 layers to prevent them from being retrained
  for (const layer of truncatedMobilenet.layers) {
    layer.trainable = false;
  }

  const model = tf.sequential();
  model.add(tf.layers.inputLayer({ inputShape: [224, 224, 3] }));
  model.add(truncatedMobilenet);
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.5 }));

  // Determine total number of classes (use both componentType and frameLayout lengths)
  const totalClasses = Math.max(labelMap.frameLayout.length, labelMap.componentType.length); // Use the maximum
  console.log(`Total classes (units): ${totalClasses}`);
  model.add(tf.layers.dense({ units: totalClasses, activation: 'softmax' }));

  model.compile({
    optimizer: tf.train.adam(),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  console.log('Fine-tuning the model...');
  try {
    await model.fit(xs, ys, {
      epochs: 10,
      validationSplit: 0.2,
      callbacks: tf.node.tensorBoard('./logs')
    });
    console.log('Model fine-tuning complete.');
    return model;
  } catch (error) {
    console.error('Error during model fitting:', error.message);
    return null;
  }
}

// Main execution
console.log("Script started");
(async () => {
  try {
    const preparedData = await prepareDataset();
    if (preparedData) {
      const { xs, ys, labelMap } = preparedData;
      console.log('Dataset prepared.');

      const model = await fineTuneModel(xs, ys, labelMap);
      if (model) {
        await model.save('file://./model');
        console.log('Model saved.');
      } else {
        console.error('Model not saved due to errors.');
      }
    } else {
      console.error('Failed to prepare dataset.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
})();

console.log('Script reached the end');
