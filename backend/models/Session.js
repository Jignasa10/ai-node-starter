import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  role: String,
  content: String,
  mode: {
    type: String,
    enum: ["pdf", "chat"],
    default: "chat",
  },
});

const SessionSchema = new mongoose.Schema({
  sessionId: String,
  messages: [MessageSchema],
});

export default mongoose.model("Session", SessionSchema);
