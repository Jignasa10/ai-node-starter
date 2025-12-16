import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔹 Chat API
app.post("/ai/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array required" });
    }

    const chatMessages = [
      {
        role: "system",
        content: "You are a helpful and professional business chatbot.",
      },
      ...messages,
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages,
      max_tokens: 300,
      temperature: 0.6,
    });

    res.json({
      success: true,
      message: response.choices[0].message.content,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Chatbot failed" });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("Chatbot API running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
