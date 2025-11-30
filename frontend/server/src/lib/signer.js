import { ethers } from "ethers";

/**
 * Sign a compensation message
 * @param {string} recipient - Recipient address
 * @param {number} nonce - Unique nonce
 * @param {string} contractAddress - Contract address
 * @param {number} chainId - Chain ID
 * @param {string} privateKey - Owner's private key
 * @returns {string} - Signature as hex string
 */
export function signCompensationMessage(
  recipient,
  nonce,
  contractAddress,
  chainId,
  privateKey
) {
  // COMPENSATE_AMOUNT = 5 * 1e18
  const COMPENSATE_AMOUNT = ethers.parseEther("5");

  // Create message hash (must match contract logic)
  const messageHash = ethers.solidityPackedKeccak256(
    ["address", "uint256", "uint256", "address", "uint256"],
    [recipient, nonce, COMPENSATE_AMOUNT, contractAddress, chainId]
  );

  // Convert to eth signed message hash (contract uses ECDSA.toEthSignedMessageHash)
  // This is equivalent to keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash))
  const messagePrefix = "\x19Ethereum Signed Message:\n32";
  const prefixedMessage = ethers.concat([
    ethers.toUtf8Bytes(messagePrefix),
    ethers.getBytes(messageHash),
  ]);
  const ethSignedMessageHash = ethers.keccak256(prefixedMessage);

  // Sign the eth signed message hash
  const wallet = new ethers.Wallet(privateKey);
  const sig = wallet.signingKey.sign(ethSignedMessageHash);

  // Return the signature as hex string (r, s, v)
  // r and s are 32 bytes each, v is 1 byte (27 or 28)
  // Format v as a single byte
  const vByte = ethers.toBeHex(sig.v, 1);
  return ethers.concat([sig.r, sig.s, vByte]);
}

/**
 * Sign a refund message
 * @param {string} recipient - Recipient address
 * @param {number} nonce - Unique nonce
 * @param {string} contractAddress - Contract address
 * @param {number} chainId - Chain ID
 * @param {string} privateKey - Owner's private key
 * @returns {string} - Signature as hex string
 */
export function signRefundMessage(
  recipient,
  nonce,
  contractAddress,
  chainId,
  privateKey
) {
  // STAKE_AMOUNT = 3 * 1e18
  const STAKE_AMOUNT = ethers.parseEther("3");

  // Create message hash (must match contract logic)
  const messageHash = ethers.solidityPackedKeccak256(
    ["address", "uint256", "uint256", "address", "uint256"],
    [recipient, nonce, STAKE_AMOUNT, contractAddress, chainId]
  );

  // Convert to eth signed message hash (contract uses ECDSA.toEthSignedMessageHash)
  // This is equivalent to keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash))
  const messagePrefix = "\x19Ethereum Signed Message:\n32";
  const prefixedMessage = ethers.concat([
    ethers.toUtf8Bytes(messagePrefix),
    ethers.getBytes(messageHash),
  ]);
  const ethSignedMessageHash = ethers.keccak256(prefixedMessage);

  // Sign the eth signed message hash
  const wallet = new ethers.Wallet(privateKey);
  const sig = wallet.signingKey.sign(ethSignedMessageHash);

  // Return the signature as hex string (r, s, v)
  // r and s are 32 bytes each, v is 1 byte (27 or 28)
  // Format v as a single byte
  const vByte = ethers.toBeHex(sig.v, 1);
  return ethers.concat([sig.r, sig.s, vByte]);
}

/**
 * Sign a stake message for stakeViaRelayer
 * @param {string} user - User address
 * @param {number} nonce - User's current nonce
 * @param {string} contractAddress - Contract address
 * @param {number} chainId - Chain ID
 * @param {string} privateKey - User's private key (for signing)
 * @returns {string} - Signature as hex string
 */
export function signStakeMessage(
  user,
  nonce,
  contractAddress,
  chainId,
  privateKey
) {
  // STAKE_AMOUNT = 3 * 1e18
  const STAKE_AMOUNT = ethers.parseEther("3");

  // Create message hash (must match contract logic)
  // Contract uses: keccak256(abi.encodePacked("STAKE", user, nonce, STAKE_AMOUNT, address(this), block.chainid))
  const messageHash = ethers.solidityPackedKeccak256(
    ["string", "address", "uint256", "uint256", "address", "uint256"],
    ["STAKE", user, nonce, STAKE_AMOUNT, contractAddress, chainId]
  );

  // Convert to eth signed message hash (contract uses MessageHashUtils.toEthSignedMessageHash)
  const messagePrefix = "\x19Ethereum Signed Message:\n32";
  const prefixedMessage = ethers.concat([
    ethers.toUtf8Bytes(messagePrefix),
    ethers.getBytes(messageHash),
  ]);
  const ethSignedMessageHash = ethers.keccak256(prefixedMessage);

  // Sign the eth signed message hash
  const wallet = new ethers.Wallet(privateKey);
  const sig = wallet.signingKey.sign(ethSignedMessageHash);

  // Return the signature as hex string (r, s, v)
  const vByte = ethers.toBeHex(sig.v, 1);
  return ethers.concat([sig.r, sig.s, vByte]);
}
