import { useCallback } from "react";
import {
  useAccount,
  usePublicClient,
  useWriteContract,
  useChainId,
} from "wagmi";
import { CHAT_ABI } from "../config/abi";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const useRefund = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();

  const CHAT_ADDRESS = import.meta.env.VITE_CHAT_CONTRACT_ADDRESS;

  return useCallback(async () => {
    if (!address || !isConnected) {
      toast.error("Please connect your wallet");
      return { success: false };
    }

    if (!publicClient) {
      toast.error("Public client not available");
      return { success: false };
    }

    if (!CHAT_ADDRESS) {
      toast.error("Contract address not configured");
      return { success: false };
    }

    try {
      // Generate a unique nonce (using timestamp)
      const nonce = Date.now();

      // Get signature from backend
      toast.loading("Requesting refund signature...", { id: "refund" });

      const signResponse = await axiosInstance.post("/game/sign-refund", {
        recipient: address,
        nonce,
        contractAddress: CHAT_ADDRESS,
        chainId,
      });

      const { signature } = signResponse.data;

      toast.dismiss("refund");
      toast.loading("Submitting refund transaction...", { id: "refund" });

      // Call the refund function on the contract with signature
      const refundHash = await writeContractAsync({
        address: CHAT_ADDRESS,
        abi: CHAT_ABI,
        functionName: "refund",
        args: [address, nonce, signature],
      });

      console.log("Refund hash:", refundHash);

      const refundReceipt = await publicClient.waitForTransactionReceipt({
        hash: refundHash,
      });

      toast.dismiss("refund");

      if (refundReceipt.status === "success") {
        toast.success("Refund successful! $3 returned to your wallet.");
        return {
          success: true,
          txHash: refundHash,
          receipt: refundReceipt,
          recipientAddress: address,
        };
      } else {
        toast.error("Refund transaction failed");
        return { success: false };
      }
    } catch (error) {
      toast.dismiss("refund");
      console.error("Refund error:", error);

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message?.includes("Signature already used")) {
        toast.error("This signature has already been used. Please try again.");
      } else if (error.message?.includes("Invalid signature")) {
        toast.error("Invalid signature. Please contact support.");
      } else if (error.message?.includes("rejected")) {
        toast.error("Transaction rejected by user");
      } else if (error.message?.includes("insufficient funds")) {
        toast.error("Insufficient funds for gas fees");
      } else {
        toast.error(`Refund failed: ${error.message || "Unknown error"}`);
      }

      return { success: false, error: error.message };
    }
  }, [address, isConnected, publicClient, writeContractAsync, chainId]);
};

export default useRefund;
