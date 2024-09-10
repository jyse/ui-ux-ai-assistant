import { cleanMaterialDesignData } from "./materialDesignCleaner";
import { cleanFigmaData } from "./figmaCleaner";

async function cleanResources(resourceType) {
  switch (resourceType) {
    case "materialDesign":
      await cleanMaterialDesignData();
      break;
    case "figma":
      await cleanFigmaData();
      break;
    default:
      console.error("Unknown resource type");
  }
}

// Call with the appropriate resource type
cleanResources("materialDesign");
cleanResources("figma"); // or "materialDesign"
