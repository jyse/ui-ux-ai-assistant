import * as tf from '@tensorflow/tfjs-node';
import { getDataset } from './prepareData.js';
import { createAndFineTuneModel } from './fineTuneModel.js';

async function trainModel() {
  // Get the prepared dataset
  const { trainDataset, valDataset, labelMap } = await getDataset();

  // Create and fine-tune the model
  const model = await createAndFineTuneModel(trainDataset);

  // Evaluate the model
  const evalResult = await model.evaluate(valDataset);
  console.log(`Evaluation result: Loss = ${evalResult[0]}, Accuracy = ${evalResult[1]}`);

  // Save the model
  await model.save('file://./ui-analysis-model');

  console.log('Model training complete and saved.');
  
  return { model, labelMap };
}

// Run the training
trainModel().then(({ model, labelMap }) => {
  console.log('Training complete. Label map:', labelMap);
}).catch(error => {
  console.error('Error during training:', error);
});