import express from "express";
import cors from "cors";
import multer from "multer";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mongoose from "mongoose";
import fetch from "node-fetch";

import Pdf from "./models/Pdf.js";
import Session from "./models/Session.js";

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/pdfchat");

const upload = multer({
  storage: multer.memoryStorage(),
});

/* ---------------- PDF UPLOAD ---------------- */
app.post("/api/upload-pdf", upload.single("file"), async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!req.file || !sessionId) {
      return res.status(400).json({ error: "Missing file or sessionId" });
    }

    const pdfData = await pdfParse(req.file.buffer);

    await Pdf.create({
      sessionId,
      filename: req.file.originalname,
      text: pdfData.text.slice(0, 8000), // safe limit
    });

    res.json({ success: true });
  } catch (err) {
    console.error("PDF UPLOAD ERROR:", err);
    res.status(500).json({ error: "PDF failed" });
  }
});

/* ---------------- ASK AI ---------------- */
app.post("/api/ask", async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: "sessionId and message required" });
    }

    // ---- detect PDF question ----
    const pdfKeywords = [
      "pdf",
      "document",
      "file",
      "uploaded",
      "page",
      "section",
      "from this",
      "according to",
    ];

    const isPdfQuestion = pdfKeywords.some((k) =>
      message.toLowerCase().includes(k)
    );

    let prompt = "";
    let mode = "chat";
    if (isPdfQuestion) {
      const pdfs = await Pdf.find({ sessionId });
      const context = pdfs.map(p => p.text).join("\n").slice(0, 8000);

      if (!context) {
        prompt = ` User asked about a PDF, but no document exists. Reply: "No PDF uploaded yet." `;
      } else {
        prompt = ` Answer ONLY using the PDF content below. If answer is not found, say "Not found in the document". PDF CONTENT: ${context} Question: ${message} `;
      }

      mode = "pdf";
    } else {
      // ---- normal chat ----
      prompt = ` You are a helpful AI assistant. Answer clearly and briefly. Question: ${message} `;
    }

    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5:0.5b",
        prompt,
        stream: false,
      }),
    });

    const data = await ollamaRes.json();
    const answer = data.response || "";

    // ---- save chat history ----
    await Session.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          messages: [
            { role: "user", content: message },
            { role: "assistant", content: answer,mode },
          ],
        },
      },
      { upsert: true }
    );

    res.json({ answer, mode });
  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: "AI failed" });
  }
});


/* -------- LOAD CHAT HISTORY -------- */
app.get("/api/history/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ sessionId });
    res.json({ messages: session?.messages || [] });
  } catch (err) {
    res.status(500).json({ error: "Failed to load history" });
  }
});


/* ---------------- START ---------------- */
app.listen(5000, () => {
  console.log("✅ Server running on port 5000");
});
