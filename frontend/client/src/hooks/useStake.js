import { useCallback } from "react";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useChainId,
} from "wagmi";
import { ethers } from "ethers";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const useStake = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  return useCallback(
    async (peerId) => {
      const CHAT_ADDRESS = import.meta.env.VITE_CHAT_CONTRACT_ADDRESS;

      if (!address || !walletClient) {
        toast.error("Please connect your wallet");
        return;
      }
      if (!publicClient) {
        toast.error("Public client not available");
        return;
      }
      if (!CHAT_ADDRESS) {
        toast.error("Contract address not set");
        return;
      }

      try {
        toast.loading("Preparing stake transaction...", { id: "stake" });

        // Get user's current nonce from backend
        const nonceResponse = await axiosInstance.get(`/game/nonce/${address}`);
        const nonce = nonceResponse.data.nonce;

        // STAKE_AMOUNT = 3 * 1e18
        const STAKE_AMOUNT = ethers.parseEther("3");

        // Create message hash (must match contract logic)
        // Contract uses: keccak256(abi.encodePacked("STAKE", user, nonce, STAKE_AMOUNT, address(this), block.chainid))
        const messageHash = ethers.solidityPackedKeccak256(
          ["string", "address", "uint256", "uint256", "address", "uint256"],
          ["STAKE", address, nonce, STAKE_AMOUNT, CHAT_ADDRESS, chainId]
        );

        // Sign the message hash
        // The contract expects the signature of: MessageHashUtils.toEthSignedMessageHash(messageHash)
        // which is: keccak256("\x19Ethereum Signed Message:\n32" + messageHash)
        toast.loading("Please sign the message in your wallet...", {
          id: "stake",
        });

        const provider = new ethers.BrowserProvider(walletClient);
        const signer = await provider.getSigner();
        
        // signMessage will automatically add the Ethereum message prefix and hash
        // But we already have a hash, so we need to sign it in a way that matches the contract
        // The contract uses MessageHashUtils.toEthSignedMessageHash which creates:
        // keccak256("\x19Ethereum Signed Message:\n32" + messageHash)
        // 
        // signMessage creates: keccak256("\x19Ethereum Signed Message:\n" + len + message)
        // 
        // For a 32-byte hash, signMessage would create:
        // keccak256("\x19Ethereum Signed Message:\n32" + messageHash)
        // which matches! So we can use signMessage with the hash bytes
        
        // Convert hash to array of bytes for signing
        const hashBytes = ethers.getBytes(messageHash);
        const signature = await signer.signMessage(hashBytes);

        // Convert signature to bytes format (r, s, v) - matching contract format
        const sig = ethers.Signature.from(signature);
        const vByte = ethers.toBeHex(sig.v, 1);
        const signatureBytes = ethers.concat([sig.r, sig.s, vByte]);

        toast.loading("Submitting stake transaction (gasless)...", {
          id: "stake",
        });

        // Send to backend - backend will call stakeViaRelayer (backend pays gas)
        const stakeResponse = await axiosInstance.post("/game/stake", {
          userAddress: address,
          signature: signatureBytes,
          nonce,
          chainId,
        });

        toast.dismiss("stake");

        if (stakeResponse.data.success) {
          toast.success("Chat stake successful (gasless)!");

          // Automatically call deposit endpoint after successful on-chain confirmation
          if (peerId) {
            try {
              await axiosInstance.post(`/game/deposit/${peerId}`);
              toast.success("Deposit confirmed on server");
            } catch (error) {
              console.error("Failed to confirm deposit on server:", error);
              toast.error("Stake successful but server confirmation failed");
            }
          }
        } else {
          toast.error("Chat stake failed");
        }
      } catch (error) {
        toast.dismiss("stake");
        console.error("Stake error:", error);

        if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else if (error.message?.includes("rejected") || error.message?.includes("denied")) {
          toast.error("Transaction rejected by user");
        } else if (error.message?.includes("insufficient funds")) {
          toast.error("Insufficient funds");
        } else {
          toast.error("Stake failed: " + (error.message || "Unknown error"));
        }
      }
    },
    [address, publicClient, walletClient, chainId]
  );
};

export default useStake;
