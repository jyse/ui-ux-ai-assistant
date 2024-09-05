import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sanitizeFilename, readMetadata, categorizeComponent, analyzeFrameLayout } from './helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Correct path to the dataset
const datasetPath = path.resolve(__dirname, '..', '..', '..', '..', 'data', 'figma_components');

export async function prepareDataset() {
  console.log('Starting to prepare dataset...');
  const metadataPath = path.join(datasetPath, 'metadata.json');
  console.log(`Looking for metadata at: ${metadataPath}`);
  
  let metadata;
  try {
    // Read and parse the metadata JSON file
    metadata = readMetadata(metadataPath);
    console.log('Metadata read successfully');
  } catch (error) {
    console.error('Error reading metadata:', error);
    return null;
  }

  let frameData = [];
  let componentData = [];

  console.log('Processing frames...');
  // Iterate through each frame in the metadata
  for (const frame of metadata.frames) {
    // Construct the path to the frame image
    const imagePath = path.join(datasetPath, 'frames', `${sanitizeFilename(frame.name)}.png`);
    // Analyze the frame layout (square, landscape, or portrait)
    const layoutLabel = analyzeFrameLayout(frame);
    // Add frame data to the array
    frameData.push({ imagePath, label: layoutLabel, type: 'frame' });
  }

  console.log('Processing components...');
  // Iterate through each component in the metadata
  for (const component of metadata.components) {
    // Construct the path to the component image
    const imagePath = path.join(datasetPath, 'components', `${sanitizeFilename(component.name)}_${sanitizeFilename(component.parentFrameId)}.png`);
    // Categorize the component (button, input, navigation, etc.)
    const componentType = categorizeComponent(component);
    // Add component data to the array
    componentData.push({ imagePath, label: componentType, type: 'component' });
  }

  console.log(`Total frames processed: ${frameData.length}`);
  console.log(`Total components processed: ${componentData.length}`);

  return { frameData, componentData };
}

// Define the label mappings for components and frame layouts
export const labelMap = {
  componentType: ['button', 'input', 'navigation', 'container', 'visual', 'other'],
  frameLayout: ['square', 'landscape', 'portrait']
};

// Main function to run when this script is executed directly
async function main() {
  console.log('prepareData SCRIPT is starting');
  const { frameData, componentData } = await prepareDataset();
  console.log('Data preparation complete.');
  console.log(`Processed ${frameData.length} frames and ${componentData.length} components.`);
  
  // Optionally, you can save this data to a file for use in preProcessing.js
  const outputPath = path.join(__dirname, 'prepared_data.json');
  fs.writeFileSync(outputPath, JSON.stringify({ frameData, componentData, labelMap }));
  console.log(`Prepared data saved to ${outputPath}`);
}

// Run the main function
main().catch(console.error);