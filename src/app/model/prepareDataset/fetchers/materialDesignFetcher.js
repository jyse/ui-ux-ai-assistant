import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

// Equivalent to __filename and __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoDir = path.resolve(
  __dirname,
  "../../../../../material-components-web/packages"
); // The correct relative path to the repo
const dataDir = path.resolve(
  __dirname,
  "../../../../../data/raw/materialdesign"
); // Moving data outside of fetchers

// Function to copy files and directories recursively
function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const items = fs.readdirSync(src);

  items.forEach((item) => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stats = fs.statSync(srcPath);

    if (stats.isDirectory()) {
      // If it's a directory, copy it recursively
      copyRecursiveSync(srcPath, destPath);
    } else {
      // If it's a file, copy it
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied file: ${srcPath} -> ${destPath}`);
    }
  });
}

// Main function to initiate the copying process
function main() {
  try {
    copyRecursiveSync(repoDir, dataDir);
    console.log(`All components from 'packages' copied to: ${dataDir}`);
  } catch (error) {
    console.error("Error copying components:", error);
  }
}

main();
