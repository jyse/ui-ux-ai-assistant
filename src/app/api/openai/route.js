import OpenAI from 'openai';

// Initialize OpenAI with the API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Specify that this code runs in a Node.js environment
export const runtime = "nodejs";

// Handle POST requests to this route
export async function POST(req) {
  try {
    // Extract the analysis result from the request body
    const body = await req.json();
    const { result } = body;

    // Check if a result was provided in the request
    if (!result) {
      return new Response(JSON.stringify({ error: "No result provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create a detailed prompt for OpenAI based on the analysis result
    const prompt = `The design was analyzed and found to have ${result} contrast. 
If it's high contrast:
- Explain the benefits for readability and accessibility.
- Suggest ways to ensure it's not too harsh on the eyes.
- Mention any potential drawbacks if overused.

If it's low contrast:
- Explain the potential issues with readability and accessibility.
- Suggest ways to improve contrast while maintaining the design aesthetic.
- Mention any appropriate uses for low contrast in UI design.

Please provide specific feedback and suggestions for improving this design based on its contrast level.`;

    // Send the prompt to OpenAI and get a response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Using the advanced GPT-4 model
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300, // Increased token limit for more detailed feedback
    });

    // Extract the feedback from OpenAI's response
    const openAIFeedback = completion.choices[0].message.content.trim();

    // Send a successful response back with the feedback
    return new Response(JSON.stringify({ success: true, feedback: openAIFeedback }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // Log any errors that occur during the process
    console.error("Error calling OpenAI API:", err);

    // Send an error response if something goes wrong
    return new Response(
      JSON.stringify({
        error: "OpenAI request failed",
        message: err.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}