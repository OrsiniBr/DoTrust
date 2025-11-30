import { ethers } from "ethers";

// Chat Contract ABI (includes new functions)
const CHAT_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "signature",
        type: "bytes",
      },
    ],
    name: "stakeViaRelayer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getNonce",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "signature",
        type: "bytes",
      },
    ],
    name: "compensate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "signature",
        type: "bytes",
      },
    ],
    name: "refund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

/**
 * Get a provider for the blockchain network
 */
function getProvider() {
  const rpcUrl = process.env.RPC_URL || process.env.POLYGON_RPC_URL;
  if (!rpcUrl) {
    throw new Error("RPC_URL or POLYGON_RPC_URL not configured in environment");
  }
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Get a wallet signer from private key
 */
function getWallet() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY not configured in environment");
  }
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
}

/**
 * Get contract instance
 */
function getChatContract() {
  const contractAddress = process.env.CHAT_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("CHAT_CONTRACT_ADDRESS not configured in environment");
  }
  const wallet = getWallet();
  return new ethers.Contract(contractAddress, CHAT_ABI, wallet);
}

/**
 * Get user's current nonce from contract
 */
export async function getUserNonce(userAddress) {
  try {
    const contract = getChatContract();
    const nonce = await contract.getNonce(userAddress);
    return Number(nonce);
  } catch (error) {
    console.error("Error getting user nonce:", error);
    throw error;
  }
}

/**
 * Call stakeViaRelayer on the contract (backend pays gas)
 */
export async function stakeViaRelayer(userAddress, nonce, signature) {
  try {
    const contract = getChatContract();
    const tx = await contract.stakeViaRelayer(userAddress, nonce, signature);
    const receipt = await tx.wait();
    return { success: true, txHash: receipt.hash, receipt };
  } catch (error) {
    console.error("Error staking via relayer:", error);
    throw error;
  }
}

/**
 * Call compensate on the contract (backend pays gas)
 */
export async function compensateOnChain(recipient, nonce, signature) {
  try {
    const contract = getChatContract();
    const tx = await contract.compensate(recipient, nonce, signature);
    const receipt = await tx.wait();
    return { success: true, txHash: receipt.hash, receipt };
  } catch (error) {
    console.error("Error compensating on chain:", error);
    throw error;
  }
}

/**
 * Call refund on the contract (backend pays gas)
 */
export async function refundOnChain(recipient, nonce, signature) {
  try {
    const contract = getChatContract();
    const tx = await contract.refund(recipient, nonce, signature);
    const receipt = await tx.wait();
    return { success: true, txHash: receipt.hash, receipt };
  } catch (error) {
    console.error("Error refunding on chain:", error);
    throw error;
  }
}

