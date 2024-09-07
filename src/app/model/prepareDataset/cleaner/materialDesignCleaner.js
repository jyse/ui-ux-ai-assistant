import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { contrastChecker } from "../utilities/contrastChecker.js";

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

// Helper function to check if a file is an image
function isImageFile(filename) {
  const imageExtensions = [".png", ".jpg", ".jpeg", ".svg"];
  return imageExtensions.includes(path.extname(filename).toLowerCase());
}

// Function to clean and organize Material Design data
async function cleanMaterialDesignData() {
  try {
    // Iterate over the raw data directory
    const components = fs.readdirSync(rawDir);

    components.forEach((component) => {
      const componentPath = path.join(rawDir, component);
      if (fs.statSync(componentPath).isDirectory()) {
        const files = fs.readdirSync(componentPath);

        files.forEach((file) => {
          const filePath = path.join(componentPath, file);

          // Check if the file is an image
          if (fs.statSync(filePath).isFile() && isImageFile(file)) {
            const cleanedName = sanitizeFilename(file);

            // Generate contrast metadata regarding file
            contrastChecker(filePath)
              .then((metadata) => {
                // Define target directories based on contrast
                const targetDir =
                  metadata.contrast === "high"
                    ? path.join(masterDatasetDir, "high_contrast", component)
                    : path.join(masterDatasetDir, "low_contrast", component);

                // Create target directory if it doesn't exist
                if (!fs.existsSync(targetDir)) {
                  fs.mkdirSync(targetDir, { recursive: true });
                }

                // Copy the file over to the organized folder
                const targetPath = path.join(targetDir, cleanedName);
                fs.copyFileSync(filePath, targetPath);

                // Save metadata (e.g., in JSON format)
                const metadataPath = path.join(
                  targetDir,
                  `${cleanedName}.json`
                );
                fs.writeFileSync(
                  metadataPath,
                  JSON.stringify(metadata, null, 2)
                );

                console.log(`Processed: ${filePath} -> ${targetPath}`);
              })
              .catch((err) => {
                console.error(`Error processing file ${filePath}:`, err);
              });
          } else {
            console.log(`Skipping unsupported file: ${filePath}`);
          }
        });
      }
    });

    console.log("Material Design data cleaned and organized.");
  } catch (error) {
    console.error("Error during cleaning:", error);
  }
}

// Helper function to sanitize file names
function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
}

// Run the cleaner
cleanMaterialDesignData();
