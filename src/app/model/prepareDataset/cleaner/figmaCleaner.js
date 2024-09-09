import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { contrastChecker } from "../utilities/contrastChecker.js";
import { sanitizeFileName } from "../utilities/sanitizeFileName.js";

// Equivalent to __filename and __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths for source and destination
const rawDir = path.resolve(__dirname, "../../../../../data/raw/figma");
const masterDatasetDir = path.resolve(
  __dirname,
  "../../../../../data/master_dataset"
);

// Map Material Design component names to generic folder names
const componentMap = {
  // "mdc-button": "button",
  // "mdc-card": "card",
  // "mdc-checkbox": "checkbox",
  // "mdc-data-table": "data-table",
  // "mdc-dialog": "dialog",
  // "mdc-drawer": "drawer",
  // "mdc-fab": "fab",
  // "mdc-list": "list",
  // "mdc-radio": "radio",
  // "mdc-slider": "slider",
  // "mdc-switch": "switch",
  // "mdc-textfield": "text-field",
  // "mdc-tooltip": "tooltip",
  // "mdc-top-app-bar": "top-app-bar"
};

// Ensure the master dataset directory and contrast subdirectories exist
function ensureDirectoriesExist() {
  console.log("ensuring master data set exists, 🐼🐼🐼🐼🐼");
  try {
    if (!fs.existsSync(masterDatasetDir)) {
      console.log("should come here 🐲");
      console.log(`Creating master dataset directory: ${masterDatasetDir}`);
      fs.mkdirSync(masterDatasetDir, { recursive: true });
    }

    const highContrastDir = path.join(masterDatasetDir, "high_contrast");
    const lowContrastDir = path.join(masterDatasetDir, "low_contrast");

    if (!fs.existsSync(highContrastDir)) {
      console.log(`Creating high contrast directory: ${highContrastDir}`);
      fs.mkdirSync(highContrastDir, { recursive: true });
    }

    if (!fs.existsSync(lowContrastDir)) {
      console.log(`Creating low contrast directory: ${lowContrastDir}`);
      fs.mkdirSync(lowContrastDir, { recursive: true });
    }
  } catch (error) {
    console.error("Error ensuring directories exist:", error);
  }
}

// Function to clean and organize Material Design data
async function cleanFigmaData() {
  console.log("cleaning Figma files 👹");
  // try {
  //   // Ensure required directories exist
  //   ensureDirectoriesExist();
  //   // Iterate over the raw data directory
  //   const components = fs.readdirSync(rawDir);
  //   for (const component of components) {
  //     const componentPath = path.join(rawDir, component);
  //     if (fs.statSync(componentPath).isDirectory()) {
  //       const componentName = componentMap[component] || component; // Generic name mapping
  //       const imagesDir = path.join(componentPath, "images");
  //       if (fs.existsSync(imagesDir)) {
  //         const files = fs.readdirSync(imagesDir);
  //         for (const file of files) {
  //           const filePath = path.join(imagesDir, file);
  //           const cleanedName = sanitizeFileName(file, "materialdesign");
  //           // Generate contrast metadata regarding the file
  //           // console.log("STEP 1: this image getting checked 👉:", filePath);
  //           const metadata = await contrastChecker(filePath); // Use await here
  //           // console.log("STEP 5: MetaData: ", metadata);
  //           // Define target directories based on contrast
  //           const contrastFolder =
  //             metadata.contrast === "high" ? "high_contrast" : "low_contrast";
  //           const targetDir = path.join(
  //             masterDatasetDir,
  //             contrastFolder,
  //             componentName
  //           );
  //           // console.log(
  //           //   // "STEP 6: target Directory of this image:",
  //           //   cleanedName,
  //           //   "is in targetDirectory 💥: ",
  //           //   targetDir
  //           // );
  //           // Create target directory if it doesn't exist
  //           if (!fs.existsSync(targetDir)) {
  //             console.log(`Creating target directory: ${targetDir}`);
  //             fs.mkdirSync(targetDir, { recursive: true });
  //           }
  //           // Copy the file to the organized folder
  //           const targetPath = path.join(targetDir, cleanedName);
  //           fs.copyFileSync(filePath, targetPath);
  //           // Save metadata (e.g., in JSON format)
  //           const metadataPath = path.join(targetDir, `${cleanedName}.json`);
  //           fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  //           // console.log(`Processed: ${filePath} -> ${targetPath}`);
  //         }
  //       }
  //     }
  //   }
  //   console.log("Material Design data cleaned and organized.");
  // } catch (error) {
  //   console.error("Error during cleaning:", error);
  // }
}

// Run the cleaner
cleanMaterialDesignData();
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { contrastChecker } from "../utilities/contrastChecker.js";
import { sanitizeFileName } from "../utilities/sanitizeFileName.js";

// Equivalent to __filename and __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths for source and destination
const rawDir = path.resolve(__dirname, "../../../../../data/raw/figma");
const masterDatasetDir = path.resolve(
  __dirname,
  "../../../../../data/master_dataset"
);

// Ensure the master dataset directory and contrast subdirectories exist
function ensureDirectoriesExist() {
  console.log("Ensuring master dataset exists... 🐼🐼🐼");

  try {
    if (!fs.existsSync(masterDatasetDir)) {
      console.log(`Creating master dataset directory: ${masterDatasetDir}`);
      fs.mkdirSync(masterDatasetDir, { recursive: true });
    }

    const highContrastDir = path.join(masterDatasetDir, "high_contrast");
    const lowContrastDir = path.join(masterDatasetDir, "low_contrast");

    if (!fs.existsSync(highContrastDir)) {
      console.log(`Creating high contrast directory: ${highContrastDir}`);
      fs.mkdirSync(highContrastDir, { recursive: true });
    }

    if (!fs.existsSync(lowContrastDir)) {
      console.log(`Creating low contrast directory: ${lowContrastDir}`);
      fs.mkdirSync(lowContrastDir, { recursive: true });
    }
  } catch (error) {
    console.error("Error ensuring directories exist:", error);
  }
}

// Function to clean and organize Figma data
async function cleanFigmaData() {
  try {
    ensureDirectoriesExist();

    // Iterate over the raw Figma data directory
    const screensAndComponents = fs.readdirSync(rawDir);

    for (const screenOrComponent of screensAndComponents) {
      const screenOrComponentPath = path.join(rawDir, screenOrComponent);

      // Process directories (assumed to be key screens or components)
      if (fs.statSync(screenOrComponentPath).isDirectory()) {
        const isKeyScreen = screenOrComponent.toLowerCase().includes("screen");
        const screenOrComponentName = sanitizeFileName(
          screenOrComponent,
          "figma"
        );

        // Check contrast for each image in the directory
        const images = fs.readdirSync(screenOrComponentPath);
        for (const image of images) {
          const imagePath = path.join(screenOrComponentPath, image);
          const cleanedName = sanitizeFileName(image, "figma");

          // Generate contrast metadata regarding the file
          console.log("Processing image:", imagePath);
          const metadata = await contrastChecker(imagePath);
          console.log("Metadata:", metadata);

          // Define target directories based on contrast
          const contrastFolder =
            metadata.contrast === "high" ? "high_contrast" : "low_contrast";
          const targetDir = path.join(
            masterDatasetDir,
            contrastFolder,
            isKeyScreen ? "figma_screens" : "figma_components",
            screenOrComponentName
          );

          // Ensure target directory exists
          if (!fs.existsSync(targetDir)) {
            console.log(`Creating target directory: ${targetDir}`);
            fs.mkdirSync(targetDir, { recursive: true });
          }

          // Copy the file to the organized folder
          const targetPath = path.join(targetDir, cleanedName);
          fs.copyFileSync(imagePath, targetPath);

          // Save metadata (e.g., in JSON format)
          const metadataPath = path.join(targetDir, `${cleanedName}.json`);
          fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

          console.log(`Processed: ${imagePath} -> ${targetPath}`);
        }
      }
    }

    console.log("Figma data cleaned and organized.");
  } catch (error) {
    console.error("Error during cleaning:", error);
  }
}

// Run the cleaner
cleanFigmaData();
