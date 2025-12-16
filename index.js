import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔹 Prompt Template Function
const buildPrompt = (userInput) => {
  return `
You are a professional AI assistant.

Task:
${userInput}

Rules:
- Be clear and concise
- Use a professional tone
- Respond in structured format if possible
- Avoid unnecessary explanations
`;
};

// 🔹 AI Generate API
app.post("/ai/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    // Input validation
    if (!prompt || prompt.trim().length < 5) {
      return res.status(400).json({
        error: "Prompt must be at least 5 characters long",
      });
    }

    const finalPrompt = buildPrompt(prompt);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: finalPrompt }],
      max_tokens: 200,        // 💰 Cost control
      temperature: 0.7,       // Balanced creativity
    });

    res.json({
      success: true,
      result: response.choices[0].message.content,
    });
  } catch (error) {
    console.error("AI ERROR :", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: "AI service unavailable. Please try again later.",
    });
  }
});

// 🔹 Health Check Route (for deployment)
app.get("/", (req, res) => {
  res.send("AI API is running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
