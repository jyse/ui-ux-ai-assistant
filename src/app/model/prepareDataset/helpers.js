import fs from 'fs';

export function sanitizeFilename(filename) {
  // Replace any non-alphanumeric characters with underscores and convert to lowercase
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

export function readMetadata(metadataPath) {
  console.log(`Reading metadata from: ${metadataPath}`);
  // Read and parse the JSON file
  const rawData = fs.readFileSync(metadataPath);
  return JSON.parse(rawData);
}

export function categorizeComponent(component) {
  // Categorize components based on their name
  const name = component.name.toLowerCase();
  if (name.includes('button')) return 'button';
  if (name.includes('input') || name.includes('field')) return 'input';
  if (name.includes('nav') || name.includes('menu')) return 'navigation';
  if (name.includes('card') || name.includes('container')) return 'container';
  if (name.includes('icon') || name.includes('image')) return 'visual';
  return 'other';
}

export function analyzeFrameLayout(frame) {
  // Determine frame layout based on its dimensions
  const { width, height } = frame.absoluteBoundingBox;
  if (Math.abs(width - height) < 50) return 'square';
  return width > height ? 'landscape' : 'portrait';
}

// Test function to run when this script is executed directly
function test() {
    console.log('Testing helper functions:');
    console.log('sanitizeFilename:', sanitizeFilename('Test File 1.png'));
    console.log('categorizeComponent:', categorizeComponent({ name: 'Login Button' }));
    console.log('analyzeFrameLayout:', analyzeFrameLayout({ absoluteBoundingBox: { width: 300, height: 600 } }));
    console.log('Helper functions test complete.');
  }
  
  // Run the test function if this script is executed directly
  if (import.meta.url === `file://${process.argv[1]}`) {
    test();
  }