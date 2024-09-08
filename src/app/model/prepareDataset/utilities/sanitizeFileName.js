// Helper function to sanitize file names and categorize components
export function sanitizeFileName(filename, resourceType) {
  // Sanitize: Remove special characters and convert to lowercase
  let sanitized = filename.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();

  // Apply specific naming logic based on resource type
  if (resourceType === "materialdesign") {
    sanitized = materialDesignCategorization(sanitized);
  }

  // Additional resource types can be added here in future
  // Example:
  // else if (resourceType === "figma") {
  //   sanitized = figmaCategorization(sanitized);
  // }

  return sanitized;
}

// Material Design-specific logic for categorizing components in file names
function materialDesignCategorization(sanitized) {
  if (sanitized.includes("button")) {
    sanitized = `button_${sanitized}`;
  } else if (sanitized.includes("card")) {
    sanitized = `card_${sanitized}`;
  } else if (sanitized.includes("checkbox")) {
    sanitized = `checkbox_${sanitized}`;
  } else if (sanitized.includes("dialog")) {
    sanitized = `dialog_${sanitized}`;
  } else if (sanitized.includes("drawer")) {
    sanitized = `drawer_${sanitized}`;
  } else if (sanitized.includes("textfield")) {
    sanitized = `text_field_${sanitized}`;
  } else if (sanitized.includes("tooltip")) {
    sanitized = `tooltip_${sanitized}`;
  }
  // Continue adding logic for other Material Design components
  return sanitized;
}
