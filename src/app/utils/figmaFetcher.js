import { Client } from "figma-js";
import axios from "axios";
import fs from "fs";
import path from "path";

const FIGMA_TOKEN = "figd_TMbVw4dYNLB34g5PkjCG9wMs6LLyMGU-A74vP-eA"; // Replace with your actual token
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
    console.error(`Error fetching image URLs for file ${fileKey}:`, error.message);
    return null;
  }
}

function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

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

async function processWireframesAndComponents(fileId, outputDir) {
  const file = await getFigmaFile(fileId);
  if (!file || !file.data || !file.data.document) {
    console.error(`Unable to process file ${fileId}. File not found or inaccessible.`);
    return;
  }

  const frames = [];
  const components = [];
  const metadata = {
    frames: [],
    components: []
  };

  function traverse(node, parentFrameId = null) {
    const keyScreenNames = [
      "Login", "Dashboard", "Signup", "Auth Screen", "Main Screen", "Profile", "Home", "Search", "Checkout",
      "Welcome", "WalkThrough", "Help", "Product", "Messages", "Activity", "Favorites", "Gallery", "Map",
      "Search", "Order", "Review", "Notifications", "Support", "Item", "Detail", "Chat", "Feed", "Onboarding",
      "Wishlist", "Media", "Location", "Results", "History", "Subscription", "Rating"
    ];

    if (node.type === "FRAME" && keyScreenNames.some((name) => node.name.toLowerCase().includes(name.toLowerCase()))) {
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

  if (frames.length === 0 && components.length === 0) {
    console.log(`No relevant frames or components found in file ${fileId}`);
    return;
  }

  const frameIds = frames.map((f) => f.id);
  const frameImageUrls = await getImageUrls(fileId, frameIds);

  for (const frame of frames) {
    const url = frameImageUrls[frame.id];
    if (url) {
      const filename = `${sanitizeFilename(frame.name)}.png`;
      const filepath = path.join(outputDir, "frames", filename);
      await downloadImage(url, filepath);
      console.log(`Downloaded frame: ${filename}`);
    }
  }

  const componentIds = components.map((c) => c.id);
  const componentImageUrls = await getImageUrls(fileId, componentIds);

  for (const component of components) {
    const url = componentImageUrls[component.id];
    if (url) {
      const filename = `${sanitizeFilename(component.name)}_${sanitizeFilename(component.parentFrameId)}.png`;
      const filepath = path.join(outputDir, "components", filename);
      try {
        await downloadImage(url, filepath);
        console.log(`Downloaded component: ${filename}`);
      } catch (error) {
        console.error(`Failed to download component: ${filename}`, error.message);
      }
    }
  }

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

const outputDir = "./figma_components";

async function fetchAllWireframesAndComponents() {
  for (const fileKey of fileKeys) {
    console.log(`Processing Figma file: ${fileKey}`);
    try {
      await processWireframesAndComponents(fileKey, outputDir);
    } catch (error) {
      console.error(`Error processing file ${fileKey}:`, error.message);
    }
  }
  console.log("All wireframes and components processed");
}

fetchAllWireframesAndComponents().catch((error) => {
  console.error("An error occurred while fetching wireframes and components:", error);
});