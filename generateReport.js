import fs from "fs";
import path from "path";

// Function to print folder structure
function printFolderStructure(dirPath, depth = 0) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    const stats = fs.statSync(fullPath);

    // Indent based on depth to show folder hierarchy
    console.log(
      "  ".repeat(depth) + (stats.isDirectory() ? `📁 ${file}` : `📄 ${file}`)
    );

    if (stats.isDirectory()) {
      printFolderStructure(fullPath, depth + 1); // Recursively print subfolders
    }
  });
}

// Specify the directory you want to analyze
const directoryPath = path.join(process.cwd(), "data");

// Create a writable stream to save the structure to a file
const writeStream = fs.createWriteStream("folder_structure_report.txt");

// Redirect console output to the file
console.log = (message) => {
  writeStream.write(message + "\n");
};

// Generate the folder structure report
printFolderStructure(directoryPath);

// Close the write stream
writeStream.end();
