import { ChatGame } from "../models/chatGame.model.js";
import Violation from "../models/violation.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

/**
 * Deduct life-line points from a user
 * @param {string} userId - User ID to penalize
 * @param {string} gameId - Game ID
 * @param {number} points - Points to deduct (1 or 2)
 * @param {string} reason - AI reasoning for the deduction
 * @param {string} messageId - Message ID that triggered the penalty
 * @returns {Promise<Object>} Updated game state
 */
export async function deductLifeLinePoints(
  userId,
  gameId,
  points,
  reason,
  messageId
) {
  try {
    const game = await ChatGame.findById(gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Determine which user to penalize
    const userIdStr = String(userId);
    const userAStr = String(game.userA);
    const userBStr = String(game.userB);

    const isUserA = userIdStr === userAStr;

    // Deduct points
    if (isUserA) {
      game.userALifeLinePoints = Math.max(
        0,
        (game.userALifeLinePoints || 5) - points
      );
    } else {
      game.userBLifeLinePoints = Math.max(
        0,
        (game.userBLifeLinePoints || 5) - points
      );
    }

    await game.save();

    const remainingPoints = isUserA
      ? game.userALifeLinePoints
      : game.userBLifeLinePoints;

    // Log violation
    await Violation.create({
      userId,
      gameId,
      messageId,
      type: points === 1 ? "low_quality" : "toxic",
      pointsDeducted: points,
      remainingPoints,
      aiReasoning: reason,
    });

    // Emit real-time update to both users
    const aSock = getReceiverSocketId(userAStr);
    const bSock = getReceiverSocketId(userBStr);

    const payload = {
      userId,
      remainingPoints,
      pointsDeducted: points,
      reason,
      userALifeLinePoints: game.userALifeLinePoints,
      userBLifeLinePoints: game.userBLifeLinePoints,
    };

    if (aSock) io.to(aSock).emit("lifeline:update", payload);
    if (bSock) io.to(bSock).emit("lifeline:update", payload);

    // Check if user ran out of points
    if (remainingPoints === 0) {
      const winnerId = isUserA ? game.userB : game.userA;
      await forfeitSession(game, userId, winnerId);
    }

    return {
      game,
      remainingPoints,
      forfeited: remainingPoints === 0,
    };
  } catch (error) {
    console.error("Error deducting life-line points:", error);
    throw error;
  }
}

/**
 * Forfeit session when user reaches 0 life-line points
 * @param {Object} game - ChatGame document
 * @param {string} loserUserId - User who lost (ran out of points)
 * @param {string} winnerUserId - User who wins
 */
async function forfeitSession(game, loserUserId, winnerUserId) {
  try {
    // Update game status
    game.state = "ended";
    game.winner = winnerUserId;
    game.expiresAt = new Date();
    await game.save();

    // Notify both users
    const aId = String(game.userA);
    const bId = String(game.userB);
    const aSock = getReceiverSocketId(aId);
    const bSock = getReceiverSocketId(bId);

    const payload = {
      loserId: String(loserUserId),
      winnerId: String(winnerUserId),
      reason: "Life-line points exhausted",
      message:
        "User ran out of life-line points. Compensation is now available.",
    };

    if (aSock) io.to(aSock).emit("session:forfeited", payload);
    if (bSock) io.to(bSock).emit("session:forfeited", payload);

    console.log(
      `Session forfeited: ${loserUserId} ran out of life-line points. Winner: ${winnerUserId}`
    );
  } catch (error) {
    console.error("Error forfeiting session:", error);
    throw error;
  }
}

/**
 * Get life-line points for a user in a game
 * @param {string} userId - User ID
 * @param {string} gameId - Game ID
 * @returns {Promise<number>} Life-line points
 */
export async function getLifeLinePoints(userId, gameId) {
  try {
    const game = await ChatGame.findById(gameId);
    if (!game) {
      return 5; // Default
    }

    const userIdStr = String(userId);
    const userAStr = String(game.userA);

    return userIdStr === userAStr
      ? game.userALifeLinePoints || 5
      : game.userBLifeLinePoints || 5;
  } catch (error) {
    console.error("Error getting life-line points:", error);
    return 5; // Default
  }
}

/**
 * Initialize life-line points when game starts (both users staked)
 * @param {string} gameId - Game ID
 */
export async function initializeLifeLinePoints(gameId) {
  try {
    const game = await ChatGame.findById(gameId);
    if (!game) {
      return;
    }

    // Only initialize if not already set
    if (game.userALifeLinePoints === undefined) {
      game.userALifeLinePoints = 5;
    }
    if (game.userBLifeLinePoints === undefined) {
      game.userBLifeLinePoints = 5;
    }

    await game.save();
  } catch (error) {
    console.error("Error initializing life-line points:", error);
  }
}
