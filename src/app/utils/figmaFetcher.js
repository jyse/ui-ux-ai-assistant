import { Client } from 'figma-js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const FIGMA_TOKEN = 'figd_IuXdq-DGsshLyBZx7Ql55eupeAlMZcghqb5ya1j-'; // Replace with your actual token
// Lances: figd_TMbVw4dYNLB34g5PkjCG9wMs6LLyMGU-A74vP-eA
const client = Client({ personalAccessToken: FIGMA_TOKEN });

async function getFigmaFile(fileKey) {
    console.log(`Fetching Figma file: ${fileKey}`);
    try {
      const file = await client.file(fileKey);
      console.log(`Successfully fetched file: ${fileKey}`);
      return file;
    } catch (error) {
      console.error(`Error fetching Figma file ${fileKey}:`, error.message);
      return null;
    }
  }

async function getImageUrls(fileKey, nodeIds) {
    console.log(`Fetching image URLs for file: ${fileKey}`);
    console.log(`Total components to fetch: ${nodeIds.length}`);
    try {
      const chunkSize = 50; // Reduced chunk size
      const imageUrls = {};
      for (let i = 0; i < nodeIds.length; i += chunkSize) {
        console.log(`Fetching URLs for components ${i} to ${i + chunkSize}`);
        const chunk = nodeIds.slice(i, i + chunkSize);
        const images = await client.fileImages(fileKey, {
          ids: chunk,
          scale: 2,
          format: 'png'
        });
        Object.assign(imageUrls, images.data.images);
        await delay(1000); // 1 second delay between requests
      }
      console.log(`Successfully fetched all image URLs for file: ${fileKey}`);
      return imageUrls;
    } catch (error) {
      console.error(`Error fetching image URLs for file ${fileKey}:`, error.message);
      return null;
    }
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }
  
  function sanitizePath(filepath) {
    const parts = filepath.split(path.sep);
    return parts.map(part => sanitizeFilename(part)).join(path.sep);
  }
  
  async function ensureDirectoryExists(dirPath) {
    const sanitizedDirPath = sanitizePath(dirPath);
    await fs.promises.mkdir(sanitizedDirPath, { recursive: true });
  }
  
  async function downloadImage(url, filepath) {
    console.log(`Downloading image: ${filepath}`);
    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
      });
      
      const sanitizedFilepath = sanitizePath(filepath);
      const dirPath = path.dirname(sanitizedFilepath);
      
      await ensureDirectoryExists(dirPath);
      
      return new Promise((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(sanitizedFilepath))
          .on('finish', () => {
            console.log(`Successfully downloaded: ${sanitizedFilepath}`);
            resolve();
          })
          .on('error', e => {
            console.error(`Error writing file: ${sanitizedFilepath}`, e);
            reject(e);
          });
      });
    } catch (error) {
      console.error(`Error downloading image from ${url}:`, error.message);
    }
  }

async function processUIKit(fileKey, outputDir) {
  console.log(`Starting to process UI kit: ${fileKey}`);
  const file = await getFigmaFile(fileKey);
  if (!file || !file.data || !file.data.document) {
    console.error(`Unable to process file ${fileKey}. File not found or inaccessible.`);
    return;
  }

  console.log(`Traversing file structure for ${fileKey}`);
  const components = [];

  function traverse(node, path = []) {
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
      components.push({ ...node, path });
    } else if (node.children) {
      node.children.forEach(child => traverse(child, [...path, node.name]));
    }
  }

  traverse(file.data.document);

  console.log(`Found ${components.length} components in file ${fileKey}`);

  if (components.length === 0) {
    console.log(`No components found in file ${fileKey}`);
    return;
  }

  const nodeIds = components.map(c => c.id);
  console.log(`Fetching image URLs for ${nodeIds.length} components`);
  const imageUrls = await getImageUrls(fileKey, nodeIds);

  if (!imageUrls) {
    console.error(`Unable to fetch image URLs for file ${fileKey}`);
    return;
  }

  console.log(`Starting to download images for file ${fileKey}`);
  for (const component of components) {
    const url = imageUrls[component.id];
    if (!url) {
      console.warn(`No image URL found for component ${component.name}`);
      continue;
    }
    const filename = `${component.path.join('_')}_${component.name}.png`;
    const filepath = path.join(outputDir, filename);
    
    try {
      await downloadImage(url, filepath);
    } catch (error) {
      console.error(`Failed to download image for component: ${component.name}`, error);
    }
  }

  console.log(`Finished processing UI kit: ${fileKey}`);
}

const fileKeys = [
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
    console.log(`\n--- Processing Figma file: ${fileKey} ---`);
    await processUIKit(fileKey, outputDir);
    console.log(`--- Completed processing: ${fileKey} ---\n`);
  }
  console.log('All UI kits processed');
}

fetchAllUIKits().catch(error => {
    console.error('An error occurred while fetching UI kits:', error);
  });