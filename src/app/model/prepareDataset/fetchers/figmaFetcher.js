import dotenv from "dotenv";
dotenv.config(); // This loads the .env file
import { Client } from "figma-js";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sanitizeFileName } from "../utilities/sanitizeFileName.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const figmaAPIKey = process.env.FIGMA_API_KEY; // Use environment variable for the token
const client = Client({ personalAccessToken: figmaAPIKey });

// Track processed files
const processedFilesLog = path.join(__dirname, "processed_files.json");

// Ensure the output directory exists
async function ensureDirectoryExists(directory) {
  try {
    await fs.promises.mkdir(directory, { recursive: true });
    console.log(`Directory ensured: ${directory}`);
  } catch (error) {
    console.error(`Error ensuring directory ${directory}:`, error.message);
  }
}

// Log processed file
async function logProcessedFile(fileKey) {
  let processedFiles = [];
  if (fs.existsSync(processedFilesLog)) {
    processedFiles = JSON.parse(fs.readFileSync(processedFilesLog, "utf8"));
  }
  if (!processedFiles.includes(fileKey)) {
    processedFiles.push(fileKey);
    fs.writeFileSync(
      processedFilesLog,
      JSON.stringify(processedFiles, null, 2)
    );
  }
}

// Check if a file has already been processed
async function isFileProcessed(fileKey) {
  if (fs.existsSync(processedFilesLog)) {
    const processedFiles = JSON.parse(
      fs.readFileSync(processedFilesLog, "utf8")
    );
    return processedFiles.includes(fileKey);
  }
  return false;
}

// Fetch the Figma file using its file key
async function getFigmaFile(fileKey) {
  try {
    const file = await client.file(fileKey);
    return file;
  } catch (error) {
    console.error(`Error fetching Figma file ${fileKey}:`, error.message);
    return null;
  }
}

// Fetch the image URLS for a set of node IDs (frames or components)
async function getImageUrls(fileKey, nodeIds) {
  try {
    const chunkSize = 100;
    const imageUrls = {};
    for (let i = 0; i < nodeIds.length; i += chunkSize) {
      const chunk = nodeIds.slice(i, i + chunkSize);
      const images = await client.fileImages(fileKey, {
        ids: chunk,
        scale: 2,
        format: "png"
      });
      Object.assign(imageUrls, images.data.images);
    }
    return imageUrls;
  } catch (error) {
    console.error(
      `Error fetching image URLs for file ${fileKey}:`,
      error.message
    );
    return null;
  }
}

// Download the image from the URL and save it to the filesystem
async function downloadImage(url, filepath) {
  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream"
    });

    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });

    return new Promise((resolve, reject) => {
      response.data
        .pipe(fs.createWriteStream(filepath))
        .on("finish", () => resolve())
        .on("error", (e) => reject(e));
    });
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error.message);
  }
}

// Process both wireframes (key screens) and components from the Figma file
async function processWireframesAndComponents(fileId, outputDir) {
  const file = await getFigmaFile(fileId);
  if (!file || !file.data || !file.data.document) {
    console.error(
      `Unable to process file ${fileId}. File not found or inaccessible.`
    );
    return;
  }

  const frames = [];
  const components = [];
  const metadata = {
    frames: [],
    components: []
  };

  // Traverse the Figma document and find frames (key screens) and components
  function traverse(node, parentFrameId = null) {
    const keyScreenNames = [
      "Login",
      "Dashboard",
      "Signup",
      "Auth Screen",
      "Main Screen",
      "Profile",
      "Home",
      "Search",
      "Checkout",
      "Welcome",
      "WalkThrough",
      "Help",
      "Product",
      "Messages",
      "Activity",
      "Favorites",
      "Gallery",
      "Map",
      "Search",
      "Order",
      "Review",
      "Notifications",
      "Support",
      "Item",
      "Detail",
      "Chat",
      "Feed",
      "Onboarding",
      "Wishlist",
      "Media",
      "Location",
      "Results",
      "History",
      "Subscription",
      "Rating"
    ];

    if (
      node.type === "FRAME" &&
      keyScreenNames.some((name) =>
        node.name.toLowerCase().includes(name.toLowerCase())
      )
    ) {
      frames.push(node);
      metadata.frames.push({
        id: node.id,
        name: node.name,
        absoluteBoundingBox: node.absoluteBoundingBox
      });
    } else if (node.type === "COMPONENT" || node.type === "INSTANCE") {
      components.push({ ...node, parentFrameId });
      metadata.components.push({
        id: node.id,
        name: node.name,
        type: node.type,
        parentFrameId: parentFrameId,
        position: node.absoluteBoundingBox
      });
    }

    if (node.children) {
      node.children.forEach((child) => traverse(child, node.id));
    }
  }

  traverse(file.data.document);

  // Stop if no relevant frames or components are found
  if (frames.length === 0 && components.length === 0) {
    console.log(`No relevant frames or components found in file ${fileId}`);
    return;
  }

  // Ensure sub-directories exist for frames and components
  const framesDir = path.join(outputDir, "frames");
  const componentsDir = path.join(outputDir, "components");

  await ensureDirectoryExists(framesDir);
  await ensureDirectoryExists(componentsDir);

  // Fetch and save the images for key screens (frames)
  const frameIds = frames.map((f) => f.id);
  const frameImageUrls = await getImageUrls(fileId, frameIds);

  for (const frame of frames) {
    const url = frameImageUrls[frame.id];
    if (url) {
      const filename = `${sanitizeFileName(frame.name, "figma")}.png`;
      const filepath = path.join(outputDir, "frames", filename);
      await downloadImage(url, filepath);
      console.log(`Downloaded frame: ${filename}`);
    }
  }

  // Fetch and save the images for components
  const componentIds = components.map((c) => c.id);
  const componentImageUrls = await getImageUrls(fileId, componentIds);

  for (const component of components) {
    const url = componentImageUrls[component.id];
    if (url) {
      const filename = `${sanitizeFileName(
        component.name,
        "figma"
      )}_${sanitizeFileName(component.parentFrameId, "figma")}.png`;
      const filepath = path.join(outputDir, "components", filename);
      try {
        await downloadImage(url, filepath);
        console.log(`Downloaded component: ${filename}`);
      } catch (error) {
        console.error(
          `Failed to download component: ${filename}`,
          error.message
        );
      }
    }
  }

  // Save the metadata for the Figma file
  const metadataFilePath = path.join(outputDir, "metadata.json");
  fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2));
  console.log(`Metadata saved to ${metadataFilePath}`);
}

const fileKeys = [
  "NFwM2NlCKOcezavU34df5W",
  "2II6f7YhJNbnfsZ4Hjpdyf",
  "GLP26PdcL7XC2qSJ5BXMhR",
  "9HDtrhtrqrpiKDTps05S0L",
  "r0rkXHzWhWQF4fw951UUTM",
  "1nmPr3ZbIxiwyyYMiejyqS",
  "NEsdoTg6cmhsBO8SZ1LPcj",
  "TeEDVA3atoMihlKUoydcae",
  "eWBIN3iwIApgNcCq3MpWu0",
  "enUK2QmBWn8XIlqhI70Fqs",
  "jUUax5RKeO1S7Zf0CttAjy",
  "3Ubj0IUKgG8z5AopZJzrZD",
  "MlbMyARbccwmrtAj9aefNZ"
];

// Directory to store raw Figma data (adjust to a valid path within your project)
const outputDir = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "..",
  "data",
  "raw",
  "figma"
);

// Fetch and process Figma files
async function fetchAllWireframesAndComponents() {
  for (const fileKey of fileKeys) {
    if (await isFileProcessed(fileKey)) {
      console.log(`Skipping already processed file: ${fileKey}`);
      continue;
    }

    console.log(`Processing Figma file: ${fileKey}`);
    try {
      await processWireframesAndComponents(fileKey, outputDir);
      await logProcessedFile(fileKey);
    } catch (error) {
      console.error(`Error processing file ${fileKey}:`, error.message);
    }
  }
  console.log("All wireframes and components processed");
}

// Run the fetcher
fetchAllWireframesAndComponents().catch((error) => {
  console.error(
    "An error occurred while fetching wireframes and components:",
    error
  );
});
