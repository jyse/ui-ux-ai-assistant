import { Client } from 'figma-js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const FIGMA_TOKEN = 'YOUR_FIGMA_PERSONAL_ACCESS_TOKEN';
const client = Client({ personalAccessToken: FIGMA_TOKEN });

async function getFigmaFile(fileId) {
  try {
    const file = await client.file(fileId);
    return file;
  } catch (error) {
    console.error('Error fetching Figma file:', error);
  }
}

async function getImageUrls(fileId, nodeIds) {
  try {
    const images = await client.fileImages(fileId, {
      ids: nodeIds,
      scale: 2,
      format: 'png'
    });
    return images.data.images;
  } catch (error) {
    console.error('Error fetching image URLs:', error);
  }
}

async function downloadImage(url, filepath) {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  
  return new Promise((resolve, reject) => {
    response.data
      .pipe(fs.createWriteStream(filepath))
      .on('finish', () => resolve())
      .on('error', e => reject(e));
  });
}

async function processUIKit(fileId, outputDir) {
  const file = await getFigmaFile(fileId);
  const components = [];

  // Recursively find all components
  function traverse(node) {
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
      components.push(node);
    } else if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(file.data.document);

  const nodeIds = components.map(c => c.id);
  const imageUrls = await getImageUrls(fileId, nodeIds);

  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    const url = imageUrls[component.id];
    const filename = `${component.name.replace(/\s+/g, '_')}.png`;
    const filepath = path.join(outputDir, filename);
    
    await downloadImage(url, filepath);
    console.log(`Downloaded: ${filename}`);
  }
}

// Usage
const fileId = 'FIGMA_FILE_ID'; // Replace with the actual Figma file ID
const outputDir = './figma_components';

if (!fs.existsSync(outputDir)){
  fs.mkdirSync(outputDir, { recursive: true });
}

processUIKit(fileId, outputDir);