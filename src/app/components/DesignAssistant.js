"use client";

import React, { useState } from "react";

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
      try {
        const response = await fetch("/api/preprocess", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ imagePath: selectedImage }) // Sending image path or data
        });

        const data = await response.json();
        setFeedback(data.processedImage || "No feedback received");
      } catch (err) {
        console.error("Error fetching feedback:", err);
      }
    }
  };

  return (
    <div className="design-assistant">
      <h2>AI-Powered UI/UX Design Assistant</h2>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {selectedImage && (
        <div>
          <h3>Uploaded Design:</h3>
          <img
            src={selectedImage}
            alt="Uploaded design"
            width={300}
            height={200}
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
