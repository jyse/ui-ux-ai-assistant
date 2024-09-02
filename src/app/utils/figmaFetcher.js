import { Client } from "figma-js";
import axios from "axios";
import fs from "fs";
import path from "path";
import pLimit from 'p-limit';

const FIGMA_TOKEN = "figd_TMbVw4dYNLB34g5PkjCG9wMs6LLyMGU-A74vP-eA"; // Replace with your actual token
const client = Client({ personalAccessToken: FIGMA_TOKEN });

const limit = pLimit(5); // Limit concurrent downloads to 5

const STANDARD_LABELS = {
  "Login Screen": "Login",
  "Sign-In": "Login",
  "Auth Screen": "Login",
  "Dashboard": "Dashboard",
  "Main Screen": "Dashboard",
  // Add more mappings as necessary
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function standardizeLabel(name) {
  for (const [key, value] of Object.entries(STANDARD_LABELS)) {
    if (new RegExp(key, "i").test(name)) {
      return value;
    }
  }
  return name;
}

async function getFigmaFile(fileKey) {
  console.log(`Fetching Figma file: ${fileKey}`);
  try {
    const file = await client.file(fileKey);
    console.log(`Successfully fetched Figma file: ${fileKey}`);
    return file;
  } catch (error) {
    console.error(`Error fetching Figma file ${fileKey}:`, error.message);
    return null;
  }
}

// Updated to use PNG format instead of JPG
async function getImageUrls(fileKey, nodeIds) {
  console.log(`Fetching image URLs for ${nodeIds.length} nodes in file: ${fileKey}`);
  console.log(`Node IDs being sent: ${nodeIds.join(", ")}`);

  try {
    const chunkSize = 25;  // Reduced the chunk size to avoid errors
    const imageUrls = {};
    for (let i = 0; i < nodeIds.length; i += chunkSize) {
      const chunk = nodeIds.slice(i, i + chunkSize);
      console.log(`Fetching image URLs for chunk: ${i / chunkSize + 1}, Node IDs: ${chunk.join(", ")}`);
      const images = await client.fileImages(fileKey, {
        ids: chunk,
        scale: 1, // Optimized scale for wireframes
        format: "png" // Updated to PNG format for higher quality images
      });
      if (!images.data.images) {
        console.error(`No images returned for chunk: ${i / chunkSize + 1}`);
      }
      Object.assign(imageUrls, images.data.images);
      console.log(`Fetched image URLs for chunk: ${i / chunkSize + 1}`);
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
      method: "GET",
      responseType: "stream",
    });

    console.log(`Downloading image from URL: ${url}`);
    console.log(`Expected file path: ${filepath}`);
    console.log(`Response headers: ${JSON.stringify(response.headers)}`);

    const contentLength = parseInt(response.headers['content-length'], 10);

    // Ensure that content-length is not zero or too small
    if (contentLength === 0 || contentLength < 1000) {  // Adjust the size limit as needed
      console.error(`Content-Length is too small (${contentLength} bytes) for URL: ${url}. Skipping this download.`);
      return;
    }

    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });

    return new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(filepath);

      fileStream.on("open", () => {
        console.log(`File stream opened: ${filepath}`);
      });

      fileStream.on("close", () => {
        console.log(`File stream closed: ${filepath}`);
      });

      response.data
        .pipe(fileStream)
        .on("finish", () => {
          console.log(`Successfully wrote file: ${filepath}`);
          resolve();
        })
        .on("error", (error) => {
          console.error(`Error writing file ${filepath}:`, error.message);
          reject(error);
        });
    });
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error.message);
    throw error;
  }
}


function isRelevantNode(node) {
  // Check if the node is a frame or group and matches common names for wireframes/mockups
  return (node.type === "FRAME" || node.type === "GROUP") && /Wireframe|Mockup|Screen|Layout/i.test(node.name);
}

function isLargeEnough(node) {
  // Filter out small components that are unlikely to be full wireframes/mockups
  return node.absoluteBoundingBox && node.absoluteBoundingBox.width > 300 && node.absoluteBoundingBox.height > 300;
}

async function processUIKit(fileId, outputDir) {
  const file = await getFigmaFile(fileId);
  if (!file || !file.data || !file.data.document) {
    console.error(`Unable to process file ${fileId}. File not found or inaccessible.`);
    return;
  }

  console.log(`Processing components from Figma file: ${fileId}`);
  const components = [];

  function traverse(node) {
    if (isRelevantNode(node) && isLargeEnough(node)) {
      const standardizedLabel = standardizeLabel(node.name);
      components.push({ node, label: standardizedLabel });
    } else if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(file.data.document);

  if (components.length === 0) {
    console.log(`No relevant components found in file: ${fileId}`);
    return;
  }

  console.log(`Found ${components.length} relevant components in file: ${fileId}`);

  const batchSize = 50;
  for (let i = 0; i < components.length; i += batchSize) {
    const batch = components.slice(i, i + batchSize);
    const nodeIds = batch.map(c => c.node.id);
    const imageUrls = await getImageUrls(fileId, nodeIds);

    // Delay between batches to handle rate limiting
    await delay(1000);

    if (!imageUrls) {
      console.error(`Unable to fetch image URLs for file ${fileId}`);
      return;
    }

    console.log(`Downloading images for batch ${i / batchSize + 1} of ${Math.ceil(components.length / batchSize)}`);
    const downloadPromises = batch.map(component => {
      const { node, label } = component;
      const url = imageUrls[node.id];
      if (!url) {
        console.error(`No URL found for node ID: ${node.id}, label: ${label}`);
        return Promise.resolve(); // Skip this image
      }
      const filename = `${label.replace(/\s+/g, "_")}_${node.id}.png`; // Force the .png extension
      return limit(() => downloadImage(url, path.join(outputDir, filename)));
    });
    await Promise.all(downloadPromises);
  }
}

const fileKeys = [
  "r0rkXHzWhWQF4fw951UUTM",
  "1nmPr3ZbIxiwyyYMiejyqS",
  "NEsdoTg6cmhsBO8SZ1LPcj",
  "TeEDVA3atoMihlKUoydcae",
  "eWBIN3iwIApgNcCq3MpWu0",
  "enUK2QmBWn8XIlqhI70Fqs",
  "jUUax5RKeO1S7Zf0CttAjy",
  "3Ubj0IUKgG8z5AopZJzrZD"
];

const outputDir = "./figma_components";

async function fetchAllUIKits() {
  for (const fileKey of fileKeys) {
    console.log(`Processing Figma file: ${fileKey}`);
    await processUIKit(fileKey, outputDir);
  }
  console.log("All UI kits processed");
}

fetchAllUIKits().catch((error) => {
  console.error("An error occurred while fetching UI kits:", error);
});
