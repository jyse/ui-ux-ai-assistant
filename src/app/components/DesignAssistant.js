"use client";

import React, { useState } from "react";

const DesignAssistant = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [openAIFeedback, setOpenAIFeedback] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

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
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError("");
    setFeedback("");
    setOpenAIFeedback("");

    try {
      // Step 1: Analyze Image
      const response = await fetch("/api/preprocess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageData: selectedImage }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API response:", data);

      if (data.success) {
        setFeedback(`Analysis result: ${data.result}`);

        // Step 2: Send result to OpenAI API for comprehensive feedback
        const openAIResponse = await fetch("/api/openai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ result: data.result }),
        });

        if (!openAIResponse.ok) {
          throw new Error(`OpenAI HTTP error! status: ${openAIResponse.status}`);
        }

        const openAIData = await openAIResponse.json();
        
        // New error handling for OpenAI API response
        if (openAIData.error) {
          setError(`OpenAI Error: ${openAIData.error}`);
        } else {
          setOpenAIFeedback(openAIData.feedback);
        }
      } else {
        setError("Analysis failed. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(`An error occurred during analysis: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
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
            style={{ maxWidth: "300px", maxHeight: "200px" }}
          />
        </div>
      )}
      <button onClick={handleAnalyze} disabled={!selectedImage || isAnalyzing}>
        {isAnalyzing ? "Analyzing..." : "Analyze Design"}
      </button>
      {error && (
        <div className="error">
          <p>{error}</p>
        </div>
      )}
      {feedback && (
        <div>
          <h3>Feedback:</h3>
          <p>{feedback}</p>
          {openAIFeedback && (
            <div>
              <h3>Detailed Feedback:</h3>
              <p>{openAIFeedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DesignAssistant;