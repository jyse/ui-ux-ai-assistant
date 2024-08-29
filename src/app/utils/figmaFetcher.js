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
  
  https://www.figma.com/design/r0rkXHzWhWQF4fw951UUTM/%E2%9D%96-Untitled-UI-%E2%80%93-FREE-Figma-UI-kit-and-design-system-v2.0-(Community)?t=3TlM5aqgnrGInKaU-0
  https://www.figma.com/design/1nmPr3ZbIxiwyyYMiejyqS/iOS-16-UI-Kit-for-Figma-(Community)?node-id=1002-6668&node-type=CANVAS&t=BGvEShYw7Wrsre1H-0
  https://www.figma.com/design/NEsdoTg6cmhsBO8SZ1LPcj/Mobile-UI-kit-(Community)?node-id=194-1561&node-type=CANVAS&t=GnQia22c8QEPnXae-0
  https://www.figma.com/design/TeEDVA3atoMihlKUoydcae/Instagram-UI-Kit-1.0-(Community)?t=280o4UVdqXOo4QrJ-0
  https://www.figma.com/design/eWBIN3iwIApgNcCq3MpWu0/Essential-UI---Figma-Ui-Kit-(Community)?node-id=69-5241&node-type=CANVAS&t=ZEVuqnRCDfoWhO0t-0
  https://www.figma.com/design/enUK2QmBWn8XIlqhI70Fqs/Microsoft-Teams-UI-Kit-(Community)?t=65rrH3mnOv7ehveN-0
  https://www.figma.com/design/jUUax5RKeO1S7Zf0CttAjy/Wireframes-Kit---Free-wireframing-Websites-and-SaaS-UI-UX-(Community)?node-id=292-11637&node-type=CANVAS&t=dWsEN4cxBh0y3ORF-0
  https://www.figma.com/design/3Ubj0IUKgG8z5AopZJzrZD/Mobile-App-Ui-Kit-(Community)-(Copy)?node-id=0-1&node-type=CANVAS&t=l0Ao3uEbJwBMOiLP-0
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