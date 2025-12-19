import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import multer from "multer";
import fs from "fs";

import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---------- FILE UPLOAD SETUP ----------
const upload = multer({ dest: "uploads/" });

// ---------- BASIC HEALTH CHECK ----------
app.get("/", (req, res) => {
  res.send("AI RAG API running 🚀");
});

// =====================================================
// 1️⃣ CHATBOT API (FROM DAY 4)
// =====================================================
app.post("/ai/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array required" });
    }

    const chatMessages = [
      {
        role: "system",
        content: "You are a professional business chatbot.",
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
    console.error("CHAT ERROR:", error.message);
    res.status(500).json({ error: "Chatbot failed" });
  }
});

// =====================================================
// 2️⃣ PDF UPLOAD + EMBEDDING (RAG SETUP)
// =====================================================
app.post("/ai/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const loader = new PDFLoader(req.file.path);
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 100,
    });

    const splitDocs = await splitter.splitDocuments(docs);

    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const vectorStore = await FaissStore.fromDocuments(
      splitDocs,
      embeddings
    );

    await vectorStore.save("vectorstore");

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      chunks: splitDocs.length,
    });
  } catch (err) {
    console.error("PDF UPLOAD ERROR:", err);
    res.status(500).json({ error: "PDF upload failed" });
  }
});



// =====================================================
// 3️⃣ CHAT WITH PDF (RAG QUERY)
// =====================================================
app.post("/ai/pdf-chat", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const vectorStore = await FaissStore.load(
      "vectorstore",
      embeddings
    );

    // Search relevant chunks
    const docs = await vectorStore.similaritySearch(question, 4);
    const context = docs.map((d) => d.pageContent).join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Answer strictly using the provided document context. If answer is not found, say you don't know.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion:\n${question}`,
        },
      ],
      max_tokens: 300,
    });

    res.json({
      success: true,
      answer: response.choices[0].message.content,
    });
  } catch (error) {
    console.error("PDF CHAT ERROR:", error);
    res.status(500).json({ error: "PDF chat failed" });
  }
});

// ---------- SERVER ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
