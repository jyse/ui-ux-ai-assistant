import { Client } from "figma-js";
import axios from "axios";
import fs from "fs";
import path from "path";

const FIGMA_TOKEN = "figd_IuXdq-DGsshLyBZx7Ql55eupeAlMZcghqb5ya1j-"; // Replace with your actual token
const client = Client({ personalAccessToken: FIGMA_TOKEN });

// Directories for storing data
const keyScreensDir = "./data/key_screens";
const uiComponentsDir = "./data/ui_components";
const keyScreenLabelsFile = "./data/keyScreenTrainlabels.json";
const componentLabelsFile = "./data/componentsTrainlabels.json";

// Initial label objects
let keyScreenLabels = {};
let componentLabels = {};

// Load or initialize label files
if (fs.existsSync(keyScreenLabelsFile)) {
  keyScreenLabels = JSON.parse(fs.readFileSync(keyScreenLabelsFile));
} else {
  fs.writeFileSync(
    keyScreenLabelsFile,
    JSON.stringify(keyScreenLabels, null, 2)
  );
}

if (fs.existsSync(componentLabelsFile)) {
  componentLabels = JSON.parse(fs.readFileSync(componentLabelsFile));
} else {
  fs.writeFileSync(
    componentLabelsFile,
    JSON.stringify(componentLabels, null, 2)
  );
}

// Function to fetch and process the Figma file
async function processFigmaFile(fileKey) {
  const file = await client.file(fileKey);
  const { document } = file.data;

  traverseNodes(document);

  // Save updated labels
  fs.writeFileSync(
    keyScreenLabelsFile,
    JSON.stringify(keyScreenLabels, null, 2)
  );
  fs.writeFileSync(
    componentLabelsFile,
    JSON.stringify(componentLabels, null, 2)
  );
}

// Traverse nodes to find key screens and components
function traverseNodes(node, parentScreen = null) {
  if (isKeyScreen(node)) {
    // Handle key screen
    const screenName = node.name.replace(/\s+/g, "_");
    const screenDir = path.join(keyScreensDir, screenName);
    fs.mkdirSync(screenDir, { recursive: true });

    // Add to keyScreenLabels
    keyScreenLabels[screenName] = {
      id: node.id,
      components: [],
      position: node.absoluteBoundingBox
    };

    parentScreen = screenName;
  }
  if (isComponent(node) && parentScreen) {
    // Handle UI components within a key screen
    const componentName = node.name.replace(/\s+/g, "_");
    const componentDir = path.join(uiComponentsDir, componentName);
    fs.mkdirSync(componentDir, { recursive: true });

    // Add to componentLabels
    componentLabels[componentName] = {
      id: node.id,
      screen: parentScreen,
      position: node.absoluteBoundingBox
    };

    // Update keyScreenLabels with component info
    keyScreenLabels[parentScreen].components.push(componentName);
  }

  if (node.children) {
    node.children.forEach((child) => traverseNodes(child, parentScreen));
  }
}

// Check if a node is a key screen
function isKeyScreen(node) {
  const keyScreenNames = [
    "Login",
    "Dashboard",
    "Signup",
    "Auth Screen",
    "Main Screen",
    "Profile",
    "Home",
    "Search",
    "Checkout",
    "Welcome",
    "WalkThrough",
    "Help",
    "Product",
    "Messages/",
    "Activity ",
    "Favorites/",
    "Gallery/",
    "Map/",
    "Search ",
    "Order ",
    "Review/",
    "Notifications",
    "Support",
    "Item",
    "Detail",
    "Chat",
    "Feed",
    "Onboarding",
    "Wishlist",
    "Media",
    "Location",
    "Results",
    "History",
    "Subscription",
    "Rating"
  ];
  return (
    node.type === "FRAME" &&
    keyScreenNames.some((name) => node.name.includes(name))
  );
}

// Check if a node is a UI component
function isComponent(node) {
  const componentTypes = ["Button", "Icon", "Input", "Dropdown"];
  return (
    node.type === "COMPONENT" ||
    (node.type === "INSTANCE" &&
      componentTypes.some((type) => node.name.includes(type)))
  );
}

// Start processing Figma files
const fileKeys = [
  "NFwM2NlCKOcezavU34df5W",
  "2II6f7YhJNbnfsZ4Hjpdyf"
  // "GLP26PdcL7XC2qSJ5BXMhR",
  // "9HDtrhtrqrpiKDTps05S0L",
  // "r0rkXHzWhWQF4fw951UUTM",
  // "1nmPr3ZbIxiwyyYMiejyqS",
  // "NEsdoTg6cmhsBO8SZ1LPcj",
  // "TeEDVA3atoMihlKUoydcae",
  // "eWBIN3iwIApgNcCq3MpWu0",
  // "enUK2QmBWn8XIlqhI70Fqs",
  // "jUUax5RKeO1S7Zf0CttAjy",
  // "3Ubj0IUKgG8z5AopZJzrZD",
  // "MlbMyARbccwmrtAj9aefNZ"
];

fileKeys.forEach((fileKey) => processFigmaFile(fileKey));
