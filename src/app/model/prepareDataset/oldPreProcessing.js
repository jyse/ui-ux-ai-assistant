import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadAndPreprocessImage(imagePath) {
  try {
    console.log(`Loading image: ${imagePath}`);
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    // Decode the image buffer into a tensor
    let tfImage = tf.node.decodeImage(imageBuffer);

    // Remove alpha channel if present (we only want RGB)
    if (tfImage.shape[2] === 4) {
      tfImage = tfImage.slice([0, 0, 0], [-1, -1, 3]);
    }

    // Preprocess the image:
    // 1. Resize to 224x224 (standard input size for many models)
    // 2. Convert to float values between 0 and 1
    // 3. Add a batch dimension
    return tfImage.resizeBilinear([224, 224]).toFloat().div(tf.scalar(255)).expandDims(0);
  } catch (error) {
    console.error(`Error loading image ${imagePath}:`, error.message);
    return null;
  }
}

export function padLabel(label, targetLength) {
  // Add padding to labels to ensure consistent length
  const paddingLength = targetLength - label.shape[0];
  if (paddingLength > 0) {
    const padding = tf.zeros([paddingLength], label.dtype);
    return tf.concat([label, padding]);
  }
  return label;
}

export async function processData(data, labelMap) {
  let images = [];
  let labels = [];

  for (const item of data) {
    // Load and preprocess each image
    const image = await loadAndPreprocessImage(item.imagePath);
    if (image) {
      images.push(image);
      let oneHotLabel;
      if (item.type === 'frame') {
        // Create one-hot encoded label for frames
        oneHotLabel = tf.oneHot(labelMap.frameLayout.indexOf(item.label), labelMap.frameLayout.length);
        // Pad frame labels to match component label length
        oneHotLabel = padLabel(oneHotLabel, labelMap.componentType.length);
      } else {
        // Create one-hot encoded label for components
        oneHotLabel = tf.oneHot(labelMap.componentType.indexOf(item.label), labelMap.componentType.length);
      }
      labels.push(oneHotLabel);
    }
  }

  return { images, labels };
}

export function combineAndReshapeData(processedFrames, processedComponents) {
  // Combine frame and component data
  const allImages = [...processedFrames.images, ...processedComponents.images];
  const allLabels = [...processedFrames.labels, ...processedComponents.labels];

  // Concatenate all images and labels
  const xs = tf.concat(allImages);
  // Reshape labels to 2D tensor
  const ys = tf.concat(allLabels).reshape([allLabels.length, 6]);

  return { xs, ys };
}

// Main function to run when this script is executed directly
async function main() {
    console.log('Starting data preprocessing...');
    
    // Load the prepared data from prepareData.js
    const preparedDataPath = path.join(__dirname, 'prepared_data.json');
    let preparedData;
    try {
      preparedData = JSON.parse(fs.readFileSync(preparedDataPath, 'utf8'));
    } catch (error) {
      console.error(`Error reading prepared data: ${error.message}`);
      console.error('Make sure to run prepareData.js first to generate the prepared_data.json file.');
      return;
    }
    const { frameData, componentData, labelMap } = preparedData;
  
    console.log('Processing frames...');
    const processedFrames = await processData(frameData, labelMap);
    console.log('Processing components...');
    const processedComponents = await processData(componentData, labelMap);
  
    console.log('Combining and reshaping data...');
    const { xs, ys } = combineAndReshapeData(processedFrames, processedComponents);
  
    console.log('Preprocessing complete.');
    console.log(`Final data shapes - xs: ${xs.shape}, ys: ${ys.shape}`);
  
    // Save the preprocessed data
    const outputPath = path.join(__dirname, 'preprocessed_data.json');
    try {
      // Convert tensors to arrays
      const xsArray = await xs.array();
      const ysArray = await ys.array();
  
      // Create a JSON object with your data
      const dataToSave = {
        xs: xsArray,
        ys: ysArray,
        xsShape: xs.shape,
        ysShape: ys.shape
      };
  
      // Save to a file
      fs.writeFileSync(outputPath, JSON.stringify(dataToSave));
      console.log(`Preprocessed data saved to ${outputPath}`);
  
      // Cleanup: dispose of tensors to free memory
      xs.dispose();
      ys.dispose();
    } catch (error) {
      console.error(`Error saving preprocessed data: ${error.message}`);
    }
  }
  
  // Run the main function
  main().catch(error => {
    console.error('An error occurred during preprocessing:', error);
  });