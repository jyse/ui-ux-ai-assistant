import { Client } from 'figma-js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const FIGMA_TOKEN = 'figd_IuXdq-DGsshLyBZx7Ql55eupeAlMZcghqb5ya1j-'; // Replace with your actual token
// Lances: figd_TMbVw4dYNLB34g5PkjCG9wMs6LLyMGU-A74vP-eA
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

async function getImageUrls(fileKey, nodeIds) {
  try {
    // Split nodeIds into chunks of 100 to avoid 414 errors
    const chunkSize = 100;
    const imageUrls = {};
    for (let i = 0; i < nodeIds.length; i += chunkSize) {
      const chunk = nodeIds.slice(i, i + chunkSize);
      const images = await client.fileImages(fileKey, {
        ids: chunk,
        scale: 2,
        format: 'png'
      });
      Object.assign(imageUrls, images.data.images);
    }
    return imageUrls;
  } catch (error) {
    console.error(`Error fetching image URLs for file ${fileKey}:`, error.message);
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
    
    // Ensure the directory exists
    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });
    
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

async function processUIKit(fileKey, outputDir) {
  const file = await getFigmaFile(fileKey);
  if (!file || !file.data || !file.data.document) {
    console.error(`Unable to process file ${fileKey}. File not found or inaccessible.`);
    return;
  }

  const components = [];

  function traverse(node, path = []) {
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
      components.push({ ...node, path });
    } else if (node.children) {
      node.children.forEach(child => traverse(child, [...path, node.name]));
    }
  }

  traverse(file.data.document);

  if (components.length === 0) {
    console.log(`No components found in file ${fileKey}`);
    return;
  }

  const nodeIds = components.map(c => c.id);
  const imageUrls = await getImageUrls(fileKey, nodeIds);

  if (!imageUrls) {
    console.error(`Unable to fetch image URLs for file ${fileKey}`);
    return;
  }

  for (const component of components) {
    const url = imageUrls[component.id];
    if (!url) {
      console.warn(`No image URL found for component ${component.name}`);
      continue;
    }
    const filename = `${component.path.join('_')}_${component.name.replace(/\s+/g, '_')}.png`;
    const filepath = path.join(outputDir, filename);
    
    await downloadImage(url, filepath);
    console.log(`Downloaded: ${filename}`);
  }
}

const fileKeys = [
  'r0rkXHzWhWQF4fw951UUTM',
  '1nmPr3ZbIxiwyyYMiejyqS',
  'NEsdoTg6cmhsBO8SZ1LPcj',
  'TeEDVA3atoMihlKUoydcae',
  'eWBIN3iwIApgNcCq3MpWu0',
  'enUK2QmBWn8XIlqhI70Fqs',
  'jUUax5RKeO1S7Zf0CttAjy',
  '3Ubj0IUKgG8z5AopZJzrZD',
];

const outputDir = './figma_components';

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