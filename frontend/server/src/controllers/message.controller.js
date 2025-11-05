import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { ChatGame, pairKey } from "../models/chatGame.model.js";
import { analyzeMessageQuality } from "../services/aiModerationService.js";
import {
  deductLifeLinePoints,
  initializeLifeLinePoints,
} from "../services/lifeLineService.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Enforce server-side deposit before sending a message
    const { a, b } = pairKey(senderId, receiverId);
    const game = await ChatGame.findOne({ userA: a, userB: b });
    if (!game || !game.deposits.get(String(senderId))) {
      return res
        .status(403)
        .json({ message: "Deposit required before sending messages." });
    }

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    // Manage shared timer state
    const hasA = !!game.deposits.get(String(a));
    const hasB = !!game.deposits.get(String(b));
    const bothDeposited = hasA && hasB;
    const now = new Date();

    if (bothDeposited) {
      // Initialize life-line points when both users have deposited
      if (game.userALifeLinePoints === undefined) {
        game.userALifeLinePoints = 5;
      }
      if (game.userBLifeLinePoints === undefined) {
        game.userBLifeLinePoints = 5;
      }

      if (game.state !== "running") {
        // Start round
        game.state = "running";
        game.startedBy = String(senderId);
        game.startedAt = now;
        game.expiresAt = new Date(now.getTime() + 1 * 60 * 1000);
        // Clear refund timer when game starts
        game.refundTimerStartedBy = undefined;
        game.refundTimerStartedAt = undefined;
        game.refundTimerExpiresAt = undefined;
        await game.save();

        // Initialize life-line points
        await initializeLifeLinePoints(game._id);

        const payload = {
          startedAt: game.startedAt.toISOString(),
          expiresAt: game.expiresAt.toISOString(),
          startedBy: String(senderId),
        };
        const aSock = getReceiverSocketId(String(a));
        const bSock = getReceiverSocketId(String(b));
        if (aSock) io.to(aSock).emit("game:timer:start", payload);
        if (bSock) io.to(bSock).emit("game:timer:start", payload);
      } else {
        // If the opponent replies before expiry, stop round
        const isReplyFromOpponent = String(senderId) !== String(game.startedBy);
        if (isReplyFromOpponent && game.expiresAt && now < game.expiresAt) {
          game.state = "idle";
          game.startedBy = undefined;
          game.startedAt = undefined;
          game.expiresAt = undefined;
          await game.save();

          const aSock = getReceiverSocketId(String(a));
          const bSock = getReceiverSocketId(String(b));
          if (aSock) io.to(aSock).emit("game:timer:stop", {});
          if (bSock) io.to(bSock).emit("game:timer:stop", {});
        }
      }
    } else {
      // Only one person has deposited - start refund timer if not already started
      const senderDeposited = game.deposits.get(String(senderId));
      const receiverDeposited = game.deposits.get(String(receiverId));

      if (senderDeposited && !receiverDeposited && !game.refundTimerExpiresAt) {
        // Start refund timer - give recipient 1 minute to stake back
        game.refundTimerStartedBy = String(senderId);
        game.refundTimerStartedAt = now;
        game.refundTimerExpiresAt = new Date(now.getTime() + 1 * 60 * 1000);
        await game.save();

        // Notify both users about refund timer
        const payload = {
          startedBy: String(senderId),
          expiresAt: game.refundTimerExpiresAt.toISOString(),
          type: "refund",
        };
        const aSock = getReceiverSocketId(String(a));
        const bSock = getReceiverSocketId(String(b));
        if (aSock) io.to(aSock).emit("refund:timer:start", payload);
        if (bSock) io.to(bSock).emit("refund:timer:start", payload);
      }
    }

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);

    // Analyze message in background (don't block response)
    // Only analyze if both users have deposited (active staking session)
    if (bothDeposited && game.state === "running") {
      analyzeMessageInBackground(newMessage, game, senderId);
    }
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Analyze message in background for AI moderation
 * @param {Object} message - Message document
 * @param {Object} game - ChatGame document
 * @param {string} senderId - Sender ID
 */
async function analyzeMessageInBackground(message, game, senderId) {
  try {
    // Get conversation history (last 10 messages between these two users)
    const history = await Message.find({
      $or: [
        { senderId: game.userA, receiverId: game.userB },
        { senderId: game.userB, receiverId: game.userA },
      ],
      createdAt: { $lt: message.createdAt },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .then((msgs) => msgs.reverse()); // Chronological order

    // AI Analysis
    const analysis = await analyzeMessageQuality(message, history);

    // Save analysis to message
    message.aiAnalysis = {
      ...analysis,
    };
    message.lifeLineDeduction = analysis.pointsToDeduct;
    message.penaltyApplied = analysis.pointsToDeduct > 0;
    await message.save();

    // Apply penalties if needed
    if (analysis.pointsToDeduct > 0) {
      const result = await deductLifeLinePoints(
        senderId,
        game._id,
        analysis.pointsToDeduct,
        analysis.reasoning,
        message._id
      );

      if (result.forfeited) {
        console.log(
          `User ${senderId} ran out of life-line points. Session forfeited.`
        );
      }
    }
  } catch (error) {
    console.error("Error in background message analysis:", error);
    // Don't penalize user if AI fails
  }
}
