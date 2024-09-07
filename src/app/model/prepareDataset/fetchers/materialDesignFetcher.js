import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

// Equivalent to __filename and __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoDir = path.resolve(
  __dirname,
  "../../../../../material-components-web/packages"
); // Correct relative path to the repo
const dataDir = path.resolve(
  __dirname,
  "../../../../../data/raw/materialdesign"
); // Directory to store images

// Helper function to check if the folder contains images
function containsImages(dir) {
  const validExtensions = [".png", ".jpeg", ".jpg"];

  // Recursively read directory and look for images
  const items = fs.readdirSync(dir, { withFileTypes: true });
  let hasImages = false;

  for (const item of items) {
    const itemPath = path.join(dir, item.name);
    if (
      item.isFile() &&
      validExtensions.includes(path.extname(item.name).toLowerCase())
    ) {
      hasImages = true; // Found an image
      break;
    } else if (item.isDirectory()) {
      // Recursively check subdirectories
      if (containsImages(itemPath)) {
        hasImages = true;
        break;
      }
    }
  }

  return hasImages;
}

// Function to copy image files and image directories recursively
function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const items = fs.readdirSync(src, { withFileTypes: true });

  items.forEach((item) => {
    const srcPath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);
    const stats = fs.statSync(srcPath);

    if (stats.isDirectory()) {
      // Only copy directories that contain images
      if (containsImages(srcPath)) {
        console.log(`Copying folder: ${srcPath}`);
        copyRecursiveSync(srcPath, destPath);
      }
    } else {
      // If it's a file, copy it only if it's an image
      const ext = path.extname(item.name).toLowerCase();
      if ([".png", ".jpeg", ".jpg"].includes(ext)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied file: ${srcPath} -> ${destPath}`);
      }
    }
  });
}

// Main function to initiate the copying process
function main() {
  try {
    copyRecursiveSync(repoDir, dataDir);
    console.log(`Filtered components copied to: ${dataDir}`);
  } catch (error) {
    console.error("Error copying components:", error);
  }
}

main();
