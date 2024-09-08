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
  "../../../../data/master_dataset"
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
  "mdc-top-app-bar": "top-app-bar"
};

// Function to clean and organize Material Design data
async function cleanMaterialDesignData() {
  try {
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
            console.log("STEP 1: this image getting checked 👉:", filePath);
            const metadata = await contrastChecker(filePath); // Use await here
            console.log("STEP 5: MetaData: ", metadata);

            // Define target directories based on contrast
            const targetDir =
              metadata.contrast === "high"
                ? path.join(masterDatasetDir, "high_contrast", componentName)
                : path.join(masterDatasetDir, "low_contrast", componentName);

            console.log(
              "STEP 6: target Directory of this image:",
              cleanedName,
              "is in targetDirectory 💥: ",
              targetDir
            );

            // Create target directory if it doesn't exist
            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true });
            }

            // Copy the file to the organized folder
            const targetPath = path.join(targetDir, cleanedName);
            fs.copyFileSync(filePath, targetPath);

            // Save metadata (e.g., in JSON format)
            const metadataPath = path.join(targetDir, `${cleanedName}.json`);
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
