import mongoose from "mongoose";

const violationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatGame",
      required: true,
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    type: {
      type: String,
      enum: ["low_quality", "toxic"],
      required: true,
    },
    pointsDeducted: {
      type: Number,
      required: true,
    },
    remainingPoints: {
      type: Number,
      required: true,
    },
    aiReasoning: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

violationSchema.index({ userId: 1, gameId: 1 });
violationSchema.index({ createdAt: -1 });

const Violation = mongoose.model("Violation", violationSchema);

export default Violation;
