import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    // AI Analysis fields
    aiAnalysis: {
      isLowQuality: { type: Boolean, default: false },
      isToxic: { type: Boolean, default: false },
      toxicityScore: { type: Number, default: 0 },
      qualityScore: { type: Number, default: 1 },
      violationType: {
        type: String,
        enum: ["low_effort", "toxic", "spam", "none"],
        default: "none",
      },
      reasoning: { type: String, default: "" },
      confidence: { type: Number, default: 0 },
      contextAwareness: { type: Boolean, default: false },
      processedAt: { type: Date },
    },
    // Penalty tracking
    lifeLineDeduction: { type: Number, default: 0 },
    penaltyApplied: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
