import { fineTuneModel } from "../model/finetuning/fineTuneModel";

// Code Overview:
// Preprocess the uploaded image to match the input format expected by the MobileNet model (resize, normalize, etc.).
// Run the image through the loaded model using model.predict(tensor).
// Collect and interpret the model’s output.

let mobileNetModel;

// 🍣 loading dataSet before AI starts analysing it. Every time?
// 🍣 Can we somehow load the newest finetuned AI model from somewhere after training?

async function loadModel() {
  if (!mobileNetModel) {
    const dataset = await loadDataset();
    // 🍣 We're missing FREEZE function here
    // Freeze existing layers: Western Cuisine
    // Finetuning: Train it to cook Japanese Cuisine

    // 🍣 Model doesn't need to be finetuned every time the design gets analysed
    mobileNetModel = await fineTuneModel(dataset);
  }
  return mobileNetModel;
}

// ... (rest of the code remains the same)

// Analyze the design
export async function analyzeDesign(imageData) {
  const mobileNetModel = await loadModel();
  // Preprocessing of one image
  const tensor = preprocessImage(imageData);

  const prediction = model.predict(tensor);
  const results = await prediction.array();

  const categories = ["layout", "colorScheme", "usability"];
  const options = [
    ["balanced", "asymmetric", "cluttered"],
    ["harmonious", "contrasting", "monotonous"],
    ["good", "average", "poor"]
  ];

  const analysis = {};
  categories.forEach((category, i) => {
    const index = results[0][i].indexOf(Math.max(...results[0][i]));
    analysis[category] = options[i][index];
  });

  return analysis;
}