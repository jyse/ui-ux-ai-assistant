import { Client } from 'figma-js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const FIGMA_TOKEN = 'figd_TMbVw4dYNLB34g5PkjCG9wMs6LLyMGU-A74vP-eA'; // Your token
const client = Client({ personalAccessToken: FIGMA_TOKEN });

async function getFigmaFile(fileKey) {
    try {
      const file = await client.file(fileKey);
      return file;
    } catch (error) {
      console.error(`Error fetching Figma file ${fileKey}:`, error.message);
      return null;
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
    console.error(`Error fetching image URLs for file ${fileId}:`, error.message);
    return null;
  }
}

async function downloadImage(url, filepath) {
  try {
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
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error.message);
  }
}

async function processUIKit(fileId, outputDir) {
  const file = await getFigmaFile(fileId);
  if (!file || !file.data || !file.data.document) {
    console.error(`Unable to process file ${fileId}. File not found or inaccessible.`);
    return;
  }

  const components = [];

  function traverse(node) {
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
      components.push(node);
    } else if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(file.data.document);

  if (components.length === 0) {
    console.log(`No components found in file ${fileId}`);
    return;
  }

  const nodeIds = components.map(c => c.id);
  const imageUrls = await getImageUrls(fileId, nodeIds);

  if (!imageUrls) {
    console.error(`Unable to fetch image URLs for file ${fileId}`);
    return;
  }

  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    const url = imageUrls[component.id];
    if (!url) {
      console.warn(`No image URL found for component ${component.name}`);
      continue;
    }
    const filename = `${component.name.replace(/\s+/g, '_')}.png`;
    const filepath = path.join(outputDir, filename);
    
    await downloadImage(url, filepath);
    console.log(`Downloaded: ${filename}`);
  }
}

const fileKeys = [
    'FPGFvyaS4qAO9UDYpOXBcx', // Material 3 Design Kit
    'O3b4NkQnCBw3ElTjCdZ3Qj', // iOS 17 UI Kit
    'sEhsAZcx41HgTPQ5gWoq63', // Tailwind CSS UI Kit
    'zj01ZZSXvHaPCIk2UbWkd7', // Ant Design 5.0
    'W1qljjfxjPnVRjb4gxjKAD', // Figma for Developers
  ];
  
  const outputDir = './figma_components';
  
  if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  async function fetchAllUIKits() {
    for (const fileKey of fileKeys) {
      console.log(`Processing Figma file: ${fileKey}`);
      await processUIKit(fileKey, outputDir);
    }
    console.log('All UI kits processed');
  }
  
  fetchAllUIKits().catch(error => {
    console.error('An error occurred while fetching UI kits:', error);
  });