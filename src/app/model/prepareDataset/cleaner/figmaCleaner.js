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
const metadataFilePath = path.join(rawDir, "metadata.json");
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

// Process metadata and organize Figma data
async function cleanFigmaData() {
  console.log("Starting to clean Figma data...");

  try {
    ensureDirectoriesExist();

    // Load metadata
    const metadata = JSON.parse(fs.readFileSync(metadataFilePath, "utf8"));

    // Process key screens
    for (const frame of metadata.frames) {
      let frameFileName = `${frame.name}.png`; // Directly using .png extension
      console.log(frameFileName, "FRAME FILE NAME 👹👹👹👹👹👹");

      // Optionally sanitize the filename, but ensuring the extension remains correct
      frameFileName = sanitizeFileName(frameFileName, "figma").replace(
        "_png",
        ".png"
      ); // Safeguard for incorrect extension

      const frameFilePath = path.join(rawDir, "frames", frameFileName);
      console.log(frameFilePath, "FRAME FILE PATH 🍬🍬🍬🍬🍬🍬");

      if (fs.existsSync(frameFilePath)) {
        // Check contrast
        const contrastResult = await contrastChecker(frameFilePath);
        console.log("Step 2: Contrast result: ", contrastResult);

        // Define target directory based on contrast
        const contrastFolder =
          contrastResult.contrast === "high" ? "high_contrast" : "low_contrast";
        const targetDir = path.join(
          masterDatasetDir,
          contrastFolder,
          "figma_screens"
        );

        // Ensure target directory exists
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // Add logging for the target path
        const targetPath = path.join(targetDir, frameFileName);
        console.log(`Copying frame to: ${targetPath}`);

        try {
          // Copy file to the organized folder
          fs.copyFileSync(frameFilePath, targetPath);

          // Save metadata
          const metadataPath = path.join(targetDir, `${frameFileName}.json`);
          fs.writeFileSync(metadataPath, JSON.stringify(frame, null, 2));

          console.log(`Processed frame: ${frameFilePath} -> ${targetPath}`);
        } catch (copyError) {
          console.error(`Error copying file: ${frameFileName}`, copyError);
        }
      } else {
        console.error(`Frame not found: ${frameFilePath}`);
      }
    }

    // Process components
    for (const component of metadata.components) {
      let componentFileName = `${component.name}_${component.parentFrameId}.png`; // Correct extension

      // Optionally sanitize the filename, but ensuring the extension remains correct
      componentFileName = sanitizeFileName(componentFileName, "figma").replace(
        "_png",
        ".png"
      ); // Safeguard for incorrect extension

      const componentFilePath = path.join(
        rawDir,
        "components",
        componentFileName
      );

      if (fs.existsSync(componentFilePath)) {
        // Check contrast
        const contrastResult = await contrastChecker(componentFilePath);

        // Define target directory based on contrast
        const contrastFolder =
          contrastResult.contrast === "high" ? "high_contrast" : "low_contrast";
        const targetDir = path.join(
          masterDatasetDir,
          contrastFolder,
          "figma_components",
          sanitizeFileName(component.parentFrameId, "figma")
        );

        // Ensure target directory exists
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // Add logging for the target path
        const targetPath = path.join(targetDir, componentFileName);
        console.log(`Copying component to: ${targetPath}`);

        try {
          // Copy file to the organized folder
          fs.copyFileSync(componentFilePath, targetPath);

          // Save metadata
          const metadataPath = path.join(
            targetDir,
            `${componentFileName}.json`
          );
          fs.writeFileSync(metadataPath, JSON.stringify(component, null, 2));

          console.log(
            `Processed component: ${componentFilePath} -> ${targetPath}`
          );
        } catch (copyError) {
          console.error(`Error copying file: ${componentFileName}`, copyError);
        }
      } else {
        console.error(`Component not found: ${componentFilePath}`);
      }
    }

    console.log("Figma data cleaned and organized.");
  } catch (error) {
    console.error("Error during cleaning:", error);
  }
}

// Run the cleaner
cleanFigmaData();
