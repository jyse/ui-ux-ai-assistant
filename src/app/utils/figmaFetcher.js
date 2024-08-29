import { Client } from 'figma-js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const FIGMA_TOKEN = 'figd_IuXdq-DGsshLyBZx7Ql55eupeAlMZcghqb5ya1j-'; // Replace with your actual token
// Lances: figd_TMbVw4dYNLB34g5PkjCG9wMs6LLyMGU-A74vP-eA
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
const fileIds = [
  'FIGMA_FILE_ID_1',
  'FIGMA_FILE_ID_2',
  // Add more file IDs as needed
];
const outputDir = './figma_components';

if (!fs.existsSync(outputDir)){
  fs.mkdirSync(outputDir, { recursive: true });
}

async function fetchAllUIKits() {
  for (const fileId of fileIds) {
    console.log(`Processing Figma file: ${fileId}`);
    await processUIKit(fileId, outputDir);
  }
  console.log('All UI kits processed');
}

fetchAllUIKits();