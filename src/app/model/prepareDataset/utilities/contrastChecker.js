import getColors from "get-image-colors"; // Library to extract colors from images
import wcagContrast from "wcag-contrast"; // Default import for CommonJS module
const { getContrast } = wcagContrast; // Extract the getContrast function

// Function to generate contrast metadata
export async function contrastChecker(imagePath) {
  try {
    // Extract colors from the image
    const colors = await getColors(imagePath);

    if (colors.length >= 2) {
      const fgColor = colors[0].hex(); // Foreground color
      const bgColor = colors[1].hex(); // Background color

      // Calculate the contrast ratio
      const contrastRatio = getContrast(fgColor, bgColor);

      // Determine if it's high or low contrast based on WCAG thresholds
      const contrast = contrastRatio >= 4.5 ? "high" : "low";

      // Return metadata including the contrast information
      return {
        contrast: contrast,
        contrastRatio: contrastRatio,
        foregroundColor: fgColor,
        backgroundColor: bgColor
      };
    } else {
      return {
        contrast: "unknown",
        contrastRatio: "unknown",
        foregroundColor: "unknown",
        backgroundColor: "unknown"
      };
    }
  } catch (error) {
    console.error(
      `Error generating contrast metadata for ${imagePath}:`,
      error
    );
    return {
      contrast: "error",
      contrastRatio: "error",
      foregroundColor: "error",
      backgroundColor: "error"
    };
  }
}
