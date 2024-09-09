import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { contrastChecker } from "../utilities/contrastChecker.js";
import { sanitizeFileName } from "../utilities/sanitizeFileName.js";

// Equivalent to __filename and __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths for source and destination
const rawDir = path.resolve(
  __dirname,
  "../../../../../data/raw/materialdesign"
);
const masterDatasetDir = path.resolve(
  __dirname,
  "../../../../../data/master_dataset"
);

// Map Material Design component names to generic folder names
const componentMap = {
  "mdc-button": "button",
  "mdc-card": "card",
  "mdc-checkbox": "checkbox",
  "mdc-data-table": "data-table",
  "mdc-dialog": "dialog",
  "mdc-drawer": "drawer",
  "mdc-fab": "fab",
  "mdc-list": "list",
  "mdc-radio": "radio",
  "mdc-slider": "slider",
  "mdc-switch": "switch",
  "mdc-textfield": "text-field",
  "mdc-tooltip": "tooltip",
  "mdc-top-app-bar": "top-app-bar",
  "mdc-banner": "banner"
};

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

    // Ensure Material Design subdirectories exist within both high and low contrast
    ["material_design_components"].forEach((subDir) => {
      const highContrastSubDir = path.join(highContrastDir, subDir);
      const lowContrastSubDir = path.join(lowContrastDir, subDir);

      if (!fs.existsSync(highContrastSubDir)) {
        console.log(
          `Creating high contrast subdirectory: ${highContrastSubDir}`
        );
        fs.mkdirSync(highContrastSubDir, { recursive: true });
      }

      if (!fs.existsSync(lowContrastSubDir)) {
        console.log(`Creating low contrast subdirectory: ${lowContrastSubDir}`);
        fs.mkdirSync(lowContrastSubDir, { recursive: true });
      }
    });
  } catch (error) {
    console.error("Error ensuring directories exist:", error);
  }
}

// Function to clean and organize Material Design data
async function cleanMaterialDesignData() {
  try {
    // Ensure required directories exist
    ensureDirectoriesExist();

    // Iterate over the raw data directory
    const components = fs.readdirSync(rawDir);

    for (const component of components) {
      const componentPath = path.join(rawDir, component);

      if (fs.statSync(componentPath).isDirectory()) {
        const componentName = componentMap[component] || component; // Generic name mapping
        const imagesDir = path.join(componentPath, "images");

        if (fs.existsSync(imagesDir)) {
          const files = fs.readdirSync(imagesDir);

          for (const file of files) {
            const filePath = path.join(imagesDir, file);
            const cleanedName = sanitizeFileName(file, "materialdesign");

            // Generate contrast metadata regarding the file
            const metadata = await contrastChecker(filePath); // Use await here

            // Define target directories based on contrast
            const contrastFolder =
              metadata.contrast === "high" ? "high_contrast" : "low_contrast";
            const targetDir = path.join(
              masterDatasetDir,
              contrastFolder,
              "material_design_components",
              componentName
            );

            // Create target directory if it doesn't exist
            if (!fs.existsSync(targetDir)) {
              console.log(`Creating target directory: ${targetDir}`);
              fs.mkdirSync(targetDir, { recursive: true });
            }

            // Copy the file to the organized folder
            const targetPath = path.join(targetDir, cleanedName);
            fs.copyFileSync(filePath, targetPath);

            const jsonFileName = cleanedName.replace("_png", "");

            // Save metadata (e.g., in JSON format)
            const metadataPath = path.join(targetDir, `${jsonFileName}.json`);
            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

            console.log(`Processed: ${filePath} -> ${targetPath}`);
          }
        }
      }
    }

    console.log("Material Design data cleaned and organized.");
  } catch (error) {
    console.error("Error during cleaning:", error);
  }
}

// Run the cleaner
cleanMaterialDesignData();
