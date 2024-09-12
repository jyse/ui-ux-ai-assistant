"use client";

import React, { useState } from "react";

const DesignAssistant = () => {
  // Set up variables to store the image, feedback, and analysis status
  const [selectedImage, setSelectedImage] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [openAIFeedback, setOpenAIFeedback] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  // Function to handle when a user selects an image file
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

  // Function to analyze the uploaded image
  const handleAnalyze = async () => {
    if (!selectedImage) return;

    // Set the analyzing state and clear previous results
    setIsAnalyzing(true);
    setError("");
    setFeedback("");
    setOpenAIFeedback("");

    try {
      // Step 1: Send the image to our AI model for analysis
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
        // Display the result from our AI model
        setFeedback(`Analysis result: ${data.result}`);

        // Step 2: Send the result to OpenAI for more detailed feedback
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
        
        // Handle any errors from OpenAI
        if (openAIData.error) {
          setError(`OpenAI Error: ${openAIData.error}`);
        } else {
          // Display the detailed feedback from OpenAI
          setOpenAIFeedback(openAIData.feedback);
        }
      } else {
        setError("Analysis failed. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(`An error occurred during analysis: ${error.message}`);
    } finally {
      // Reset the analyzing state
      setIsAnalyzing(false);
    }
  };

  // Render the user interface
  return (
    <div className="design-assistant">
      <h2>AI-Powered UI/UX Design Assistant</h2>
      {/* Image upload input */}
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {/* Display the uploaded image */}
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
      {/* Button to start the analysis */}
      <button onClick={handleAnalyze} disabled={!selectedImage || isAnalyzing}>
        {isAnalyzing ? "Analyzing..." : "Analyze Design"}
      </button>
      {/* Display any errors */}
      {error && (
        <div className="error">
          <p>{error}</p>
        </div>
      )}
      {/* Display the feedback */}
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