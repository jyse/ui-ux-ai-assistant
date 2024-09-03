import * as tf from "@tensorflow/tfjs-node";
import * as mobilenet from "@tensorflow-models/mobilenet";
import { getDataset } from "../preparing dataset/prepareData.js/index.js";

// Loading pre-trained mobileNetModel
// Train it new skills = finetuning
// Save the newly trained model

console.log("Starting fine-tuning process...");

// Code Overview:
// Load the pre-trained MobileNet model.
// Freeze the layers of the model that you don’t want to retrain.
// Add custom layers on top of MobileNet to adapt it to your specific task.
// Compile the model with appropriate loss functions and optimizers.
// Train the model using the prepared dataset.
// Save the trained model to disk for later use.
// Use TensorFlow.js functions like model.save('path_to_save_model') to save the trained model.

export async function fineTuneModel() {
  try {
    console.log("Loading MobileNet model...");
    const baseModel = await mobilenet.load({
      version: 2,
      alpha: 1.0
    });
    console.log("MobileNet model loaded.");
    console.log("MobileNet Expected Input Shape:", [224, 224, 3]);

    // Define input tensor
    const inputs = tf.input({ shape: [224, 224, 3] });

    // Use the `infer` method instead of `predict`
    const baseModelOutputs = baseModel.infer(inputs, { pooling: "avg" });

    // Add custom layers on top of MobileNet
    const flatten = tf.layers.flatten().apply(baseModelOutputs);
    const dense1 = tf.layers
      .dense({ units: 128, activation: "relu" })
      .apply(flatten);
    const dropout = tf.layers.dropout({ rate: 0.5 }).apply(dense1);
    const dense2 = tf.layers
      .dense({ units: 64, activation: "relu" })
      .apply(dropout);
    const outputs = tf.layers
      .dense({ units: 9, activation: "softmax" })
      .apply(dense2);

    // Create the final model
    const model = tf.model({ inputs: inputs, outputs: outputs });
    console.log("Custom layers added.");

    return model;
  } catch (error) {
    console.error("Error during model creation:", error);
    throw error;
  }
}
