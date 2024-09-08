import getColors from "get-image-colors"; // Library to extract colors from images
import tinycolor from "tinycolor2"; // Import TinyColor library for contrast checking

// Function to generate contrast metadata
export async function contrastChecker(imagePath) {
  // console.log("STEP 2: this image getting checked 👉:", imagePath);
  try {
    // Extract colors from the image
    const colors = await getColors(imagePath);

    if (colors.length >= 2) {
      const fgColor = colors[0].hex(); // Foreground color
      const bgColor = colors[1].hex(); // Background color

      // Calculate the contrast ratio using TinyColor's readability function
      const contrastRatio = tinycolor.readability(fgColor, bgColor);

      // Determine if it's high or low contrast based on WCAG thresholds
      const contrast = contrastRatio >= 4.5 ? "high" : "low";
      // console.log(
      //   "STEP 3: contract of this image:",
      //   imagePath,
      //   " has a contract of",
      //   contrast
      // );

      // Return metadata including the contrast information

      // console.log(
      //   "STEP 4: Return of all contrast metadata regarding this image 🎨: ",
      //   imagePath,
      //   "contrast: ",
      //   contrast,
      //   "contrastRatio",
      //   contrastRatio,
      //   "foreGroundColor: ",
      //   fgColor,
      //   "backgroundColor: ",
      //   bgColor
      // );

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
