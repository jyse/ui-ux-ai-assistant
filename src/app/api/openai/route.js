import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure your OpenAI API key is in .env
});

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { result } = body;

    if (!result) {
      return new Response(JSON.stringify({ error: "No result provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create a prompt for OpenAI based on the result
    const prompt = `The design was analyzed and found to have ${result}. Please provide feedback and suggestions for improving this design.`;

    // Send the prompt to OpenAI API using GPT-4 model
    const completion = await openai.chat.completions.create({
      model: "gpt-4", // Using GPT-4
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
    });

    const openAIFeedback = completion.choices[0].message.content.trim();

    return new Response(JSON.stringify({ success: true, feedback: openAIFeedback }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error calling OpenAI API:", err);
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