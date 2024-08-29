'use client'

import React, { useState } from 'react';
import Image from 'next/image';
import { analyzeDesign } from '../utils/designAnalysis';
import { generateFeedback } from '../utils/openAIFeedback';

const DesignAssistant = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [feedback, setFeedback] = useState('');

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (selectedImage) {
      const analysisResult = await analyzeDesign(selectedImage);
      const feedbackText = await generateFeedback(analysisResult);
      setFeedback(feedbackText);
    }
  };

  return (
    <div className="design-assistant">
      <h2>AI-Powered UI/UX Design Assistant</h2>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {selectedImage && (
        <div>
          <h3>Uploaded Design:</h3>
          <Image
            src={selectedImage}
            alt="Uploaded design"
            width={300}
            height={200}
            layout="responsive"
          />
        </div>
      )}
      <button onClick={handleAnalyze}>Analyze Design</button>
      {feedback && (
        <div>
          <h3>Feedback:</h3>
          <p>{feedback}</p>
        </div>
      )}
    </div>
  );
};

export default DesignAssistant;