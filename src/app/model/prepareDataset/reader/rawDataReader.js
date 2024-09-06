import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Equivalent to __filename and __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to read through the entire directory recursively
function readDirectoryRecursive(dirPath, relativePath = "") {
  const files = fs.readdirSync(dirPath);
  let result = "";

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    const fileRelativePath = path.join(relativePath, file);

    // Check if it's a directory
    if (fs.statSync(fullPath).isDirectory()) {
      result += `Directory: ${fileRelativePath}\n`;
      result += readDirectoryRecursive(fullPath, fileRelativePath); // Recursively read subdirectories
    } else {
      result += `File: ${fileRelativePath} (${
        fs.statSync(fullPath).size
      } KB)\n`;
    }
  });

  return result;
}

// Main function to read from the data/raw/materialdesign folder
function main() {
  const dataPath = path.resolve(
    __dirname,
    "../../../../../data/raw/materialdesign"
  );
  const result = readDirectoryRecursive(dataPath);

  // Save the output to a text file
  const outputPath = path.resolve(
    __dirname,
    "../../../../../data/raw/materialdesign/materialdesign_structure.txt"
  );
  fs.writeFileSync(outputPath, result);
  console.log("Directory structure saved to materialdesign_structure.txt");
}

main();
