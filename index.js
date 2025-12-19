import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL = "qwen2.5:1.5b";

/**
 * STREAMING CHAT API
 */
app.post("/ai/ask", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Streaming headers
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const ollamaRes = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt: message,
        stream: true,

        // 🔥 SPEED OPTIMIZATION
        options: {
          num_predict: 150,
          num_ctx: 1024,
          temperature: 0.7,
          top_p: 0.9,
        },
      }),
    });

    const reader = ollamaRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(Boolean);

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.response) {
            res.write(json.response);
          }
        } catch {
          // ignore partial chunks
        }
      }
    }

    res.end();
  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).end("AI failed");
  }
});

app.listen(5000, () => {
  console.log("✅ Server running on port 5000");
});
