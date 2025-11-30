import { useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const useCompensate = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  return useCallback(async () => {
    if (!address || !isConnected) {
      toast.error("Please connect your wallet");
      return false;
    }

    try {
      toast.loading("Processing compensation (gasless)...", {
        id: "compensate",
      });

      // Backend handles signature generation and contract call (backend pays gas)
      const response = await axiosInstance.post("/game/compensate", {
        recipient: address,
        chainId,
      });

      toast.dismiss("compensate");

      if (response.data.success) {
        toast.success("Compensation successful (gasless)!");
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
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.message?.includes("Signature already used")) {
        toast.error("This signature has already been used. Please try again.");
      } else if (error.message?.includes("Invalid signature")) {
        toast.error("Invalid signature. Please contact support.");
      } else {
        toast.error(
          "Compensation failed: " + (error.message || "Unknown error")
        );
      }
      return false;
    }
  }, [address, isConnected, chainId]);
};

export default useCompensate;
