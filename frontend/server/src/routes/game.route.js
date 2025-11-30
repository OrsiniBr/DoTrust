import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  expireAndSetWinner,
  getStatus,
  markDeposited,
  onReplyStopRound,
  startRoundIfNeeded,
  triggerCompensation,
  signCompensation,
  signRefund,
  getUserNonceEndpoint,
  stakeViaRelayerEndpoint,
  compensateEndpoint,
  refundEndpoint,
} from "../controllers/game.controller.js";

const router = express.Router();

router.get("/status/:peerId", protectRoute, getStatus);
router.post("/deposit/:peerId", protectRoute, markDeposited);
router.post("/start/:peerId", protectRoute, startRoundIfNeeded);
router.post("/reply/:peerId", protectRoute, onReplyStopRound);
router.post("/expire/:peerId", protectRoute, expireAndSetWinner);
router.post("/compensate/:peerId", protectRoute, triggerCompensation);
router.post("/sign-compensate", protectRoute, signCompensation);
router.post("/sign-refund", protectRoute, signRefund);
// New gasless endpoints (backend pays gas)
router.get("/nonce/:userAddress", protectRoute, getUserNonceEndpoint);
router.post("/stake", protectRoute, stakeViaRelayerEndpoint);
router.post("/compensate", protectRoute, compensateEndpoint);
router.post("/refund", protectRoute, refundEndpoint);

export default router;
