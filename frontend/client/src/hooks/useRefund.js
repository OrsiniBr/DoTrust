import { useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const useRefund = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  return useCallback(async () => {
    if (!address || !isConnected) {
      toast.error("Please connect your wallet");
      return { success: false };
    }

    try {
      toast.loading("Processing refund (gasless)...", { id: "refund" });

      // Backend handles signature generation and contract call (backend pays gas)
      const response = await axiosInstance.post("/game/refund", {
        recipient: address,
        chainId,
      });

      toast.dismiss("refund");

      if (response.data.success) {
        toast.success("Refund successful! $3 returned to your wallet (gasless).");
        return {
          success: true,
          txHash: response.data.txHash,
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
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.message?.includes("Signature already used")) {
        toast.error("This signature has already been used. Please try again.");
      } else if (error.message?.includes("Invalid signature")) {
        toast.error("Invalid signature. Please contact support.");
      } else {
        toast.error(`Refund failed: ${error.message || "Unknown error"}`);
      }

      return { success: false, error: error.message };
    }
  }, [address, isConnected, chainId]);
};

export default useRefund;
