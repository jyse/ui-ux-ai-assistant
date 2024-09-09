// Helper function to sanitize file names and categorize components
export function sanitizeFileName(filename, resourceType) {
  console.log("Getting sanitized: 🎨", filename, resourceType);
  // Sanitize: Remove special characters and convert to lowercase
  let sanitized = filename.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();

  // Apply specific naming logic based on resource type
  if (resourceType === "materialdesign") {
    sanitized = materialDesignCategorization(sanitized);
  } else if (resourceType === "figma") {
    sanitized = figmaCategorization(sanitized);
  }

  // Additional resource types can be added here in future
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

// Figma-specific logic for categorizing key screens and components in file names
function figmaCategorization(sanitized) {
  if (sanitized.includes("login")) {
    sanitized = `login_${sanitized}`;
  } else if (sanitized.includes("dashboard")) {
    sanitized = `dashboard_${sanitized}`;
  } else if (sanitized.includes("signup")) {
    sanitized = `signup_${sanitized}`;
  } else if (sanitized.includes("profile")) {
    sanitized = `profile_${sanitized}`;
  } else if (sanitized.includes("component")) {
    sanitized = `component_${sanitized}`;
  }
  // Continue adding logic for other Figma key screens or components
  return sanitized;
}
