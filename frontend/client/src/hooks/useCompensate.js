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

const useCompensate = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();

  const CHAT_ADDRESS = import.meta.env.VITE_CHAT_CONTRACT_ADDRESS;

  return useCallback(async () => {
    if (!address || !isConnected) {
      toast.error("Please connect your wallet");
      return false;
    }

    if (!publicClient) {
      toast.error("Public client not available");
      return false;
    }

    if (!CHAT_ADDRESS) {
      toast.error("Contract address not configured");
      return false;
    }

    try {
      // Generate a unique nonce (using timestamp)
      const nonce = Date.now();

      // Get signature from backend
      toast.loading("Requesting compensation signature...", {
        id: "compensate",
      });

      const signResponse = await axiosInstance.post("/game/sign-compensate", {
        recipient: address,
        nonce,
        contractAddress: CHAT_ADDRESS,
        chainId,
      });

      const { signature } = signResponse.data;

      toast.dismiss("compensate");
      toast.loading("Submitting compensation transaction...", {
        id: "compensate",
      });

      // Call the compensate function on the contract with signature
      const compensateHash = await writeContractAsync({
        address: CHAT_ADDRESS,
        abi: CHAT_ABI,
        functionName: "compensate",
        args: [address, nonce, signature],
      });

      console.log("Compensate hash:", compensateHash);

      // Wait for transaction confirmation
      const compensateReceipt = await publicClient.waitForTransactionReceipt({
        hash: compensateHash,
      });

      toast.dismiss("compensate");

      if (compensateReceipt.status === "success") {
        toast.success("Compensation successful!");
        return true;
      } else {
        toast.error("Compensation failed");
        return false;
      }
    } catch (error) {
      toast.dismiss("compensate");
      console.error("Compensation error:", error);

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
        toast.error(
          "Compensation failed: " + (error.message || "Unknown error")
        );
      }
      return false;
    }
  }, [address, isConnected, publicClient, writeContractAsync, chainId]);
};

export default useCompensate;
