import * as tf from '@tensorflow/tfjs-node';
import { getDataset } from './prepareData.js';
import { createModel } from './createModel.js';
import fs from 'fs';
import path from 'path';

async function trainModel() {
  console.log('Starting model training process...');

  try {
    // Get the prepared dataset
    const { trainDataset, valDataset } = await getDataset();

    // Check if datasets are empty
    const trainSize = await trainDataset.size;
    const valSize = await valDataset.size;
    
    console.log(`Training dataset size: ${trainSize}`);
    console.log(`Validation dataset size: ${valSize}`);

    if (trainSize === 0 || valSize === 0) {
      throw new Error('Dataset is empty. Please check data preparation step.');
    }

    console.log('Datasets loaded. Creating model...');

    // Create the model
    const model = createModel();

    // Define training parameters
    const epochs = 50;
    const learningRate = 0.001;

    // Compile the model
    model.compile({
      optimizer: tf.train.adam(learningRate),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    console.log('Model compiled. Starting training...');

    // Define callbacks
    const callbacks = {
      onEpochBegin: async (epoch) => {
        console.log(`\nEpoch ${epoch + 1} of ${epochs}`);
      },
      onBatchEnd: async (batch, logs) => {
        if (batch % 10 === 0) {
          console.log(`  Batch ${batch} - loss: ${logs.loss.toFixed(4)}, accuracy: ${logs.acc.toFixed(4)}`);
        }
      },
      onEpochEnd: async (epoch, logs) => {
        console.log(`Epoch ${epoch + 1} results:`);
        console.log(`  Train loss: ${logs.loss.toFixed(4)}`);
        console.log(`  Train accuracy: ${logs.acc.toFixed(4)}`);
        console.log(`  Validation loss: ${logs.val_loss.toFixed(4)}`);
        console.log(`  Validation accuracy: ${logs.val_acc.toFixed(4)}`);
        console.log('Memory usage:', tf.memory().numBytes, 'bytes');

        // Save checkpoint
        await model.save(`file://./checkpoints/epoch_${epoch + 1}`);
        console.log(`Checkpoint saved for epoch ${epoch + 1}`);
      }
    };

    // Train the model
    const history = await model.fitDataset(trainDataset, {
      epochs: epochs,
      validationData: valDataset,
      callbacks: callbacks
    });

    console.log('Training complete. Evaluating model...');

    // Evaluate the model
    let totalLoss = 0;
    let totalAccuracy = 0;
    let batches = 0;

    await valDataset.forEachAsync(batch => {
      const evalOutput = model.evaluate(batch.xs, batch.ys);
      totalLoss += evalOutput[0].dataSync()[0];
      totalAccuracy += evalOutput[1].dataSync()[0];
      batches++;
    });

    console.log(`Final evaluation results:`);
    console.log(`  Average Loss: ${(totalLoss / batches).toFixed(4)}`);
    console.log(`  Average Accuracy: ${(totalAccuracy / batches).toFixed(4)}`);

    // Save the model
    const saveDir = './ui-analysis-model';
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }
    await model.save(`file://${saveDir}`);
    console.log(`Model saved successfully to ${saveDir}`);

    // Save training history
    const historyPath = path.join(saveDir, 'training_history.json');
    fs.writeFileSync(historyPath, JSON.stringify(history));
    console.log(`Training history saved to ${historyPath}`);

    return { model, history };
  } catch (error) {
    console.error('Error during training:', error);
    throw error;
  }
}

// Run the training
trainModel().then(({ model, history }) => {
  console.log('Training process completed successfully.');
  // Here you could add code to visualize the training history
}).catch(error => {
  console.error('Error during training:', error);
});

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});