import mongoose from "mongoose";

const PdfSchema = new mongoose.Schema({
  sessionId: String,
  filename: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Pdf", PdfSchema);
