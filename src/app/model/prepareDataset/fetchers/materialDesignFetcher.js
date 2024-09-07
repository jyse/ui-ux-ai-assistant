import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoDir = path.resolve(
  __dirname,
  "../../../../../material-components-web/packages"
);
const dataDir = path.resolve(
  __dirname,
  "../../../../../data/raw/materialdesign"
);

// Function to filter only image files
function isImageFile(fileName) {
  return /\.(png|jpe?g)$/i.test(fileName);
}

// Function to copy files and directories recursively, but only images
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
      copyRecursiveSync(srcPath, destPath);
    } else if (isImageFile(item)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied image: ${srcPath} -> ${destPath}`);
    }
  });
}

function main() {
  try {
    copyRecursiveSync(repoDir, dataDir);
    console.log(
      `Filtered image components from 'packages' copied to: ${dataDir}`
    );
  } catch (error) {
    console.error("Error copying components:", error);
  }
}

main();
