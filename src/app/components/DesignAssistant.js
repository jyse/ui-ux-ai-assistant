"use client";

import React, { useState } from "react";
import Image from "next/image";
import { analyzeDesign } from "../services/designAnalysis";
import { generateFeedback } from "../services/openAIFeedback";

// Code Overview:
// Implement file upload functionality.
// Capture and store the image data.
// Trigger the design analysis process upon image upload.

/// process - from openAIFeedback
// => Display the generated feedback on the UI so the user can understand how their design was analyzed and what improvements are suggested.

const DesignAssistant = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [feedback, setFeedback] = useState("");

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
