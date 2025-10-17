import { useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient, useWriteContract } from "wagmi";
import { claimAbi } from "../config/abi";
import toast from "react-hot-toast";

const useClaim = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient(); // ✅ Fixed: extract data
  const { writeContractAsync } = useWriteContract();

  return useCallback(
    async () => {
      const CLAIM_ADDRESS = import.meta.env.VITE_CLAIM_CONTRACT_ADDRESS ;

      // Validation checks
      if (!address || !walletClient) {
        toast.error("Please connect your wallet");
        return;
      }
      if (!publicClient) {
        toast.error("Public client not available");
        return;
      }
      if (!CLAIM_ADDRESS) {
        toast.error("Contract address not set");
        return;
      }

      try {
        toast.loading("Claiming tokens...", { id: "claim" });

        const claimHash = await writeContractAsync({
          address: CLAIM_ADDRESS,
          abi: claimAbi,
          functionName: "claim",
        });

        console.log("Claim hash:", claimHash); // ✅ Fixed: removed extra dot

        toast.loading("Waiting for confirmation...", { id: "claim" });

        const claimReceipt = await publicClient.waitForTransactionReceipt({
          hash: claimHash,
        });

        if (claimReceipt.status === "success") {
          toast.success("15 tokens claimed successfully! 🎉", { id: "claim" });
          return claimReceipt;
        } else {
          toast.error("Claim transaction failed", { id: "claim" });
          return null;
        }
      } catch (error) {
        console.error("Claim error:", error);

        // Handle specific errors
        if (error.message?.includes("You already have tokens")) {
          toast.error("You already have tokens! Balance must be 0 to claim.", { id: "claim" });
        } else if (error.message?.includes("insufficient funds")) {
          toast.error("Faucet is empty. Please contact admin.", { id: "claim" });
        } else if (error.message?.includes("rejected") || error.message?.includes("denied")) {
          toast.error("Transaction rejected by user", { id: "claim" });
        } else {
          toast.error(error.shortMessage || "Claim failed. Please try again.", { id: "claim" });
        }

        return null;
      }
    },
    [address, publicClient, walletClient, writeContractAsync]
  );
};

export default useClaim;