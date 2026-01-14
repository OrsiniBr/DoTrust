# ECDSA Signature Implementation Guide

## Overview
This document describes the ECDSA cryptographic signature system implemented in DoTrust for secure, gas-efficient compensation and refund claims without requiring complex on-chain transactions.

## System Architecture

### Components

#### 1. **Smart Contract (Chat.sol)**
Located: `/contract/src/Chat.sol`

The contract verifies ECDSA signatures for two functions:
- `compensate(address recipient, uint256 nonce, bytes signature)` - Awards $5 compensation
- `refund(address recipient, uint256 nonce, bytes signature)` - Refunds $3 stake

**Key Features:**
- Uses OpenZeppelin's `ECDSA.recover()` to validate signatures
- Uses `MessageHashUtils.toEthSignedMessageHash()` for proper message formatting
- Maintains a `usedSignatures` mapping to prevent replay attacks
- Only the contract owner can sign valid compensation/refund messages

#### 2. **Backend Signer Service (signer.js)**
Located: `/frontend/server/src/lib/signer.js`

Provides two functions:
- `signCompensationMessage()` - Signs a compensation request
- `signRefundMessage()` - Signs a refund request

**Message Structure:**
```solidity
messageHash = keccak256(
    abi.encodePacked(
        recipient,      // User's wallet address
        nonce,          // Unique identifier (timestamp)
        amount,         // 5 * 1e18 for compensation, 3 * 1e18 for refund
        contractAddress,// Chat contract address
        chainId         // Network ID (80002 for Polygon Amoy)
    )
)
```

Then converted to Eth Signed Message Hash and signed with owner's private key.

#### 3. **Backend API Endpoints**
Located: `/frontend/server/src/routes/game.route.js`

```javascript
POST /api/game/sign-compensate
Body: { recipient, nonce, contractAddress, chainId }
Response: { signature, nonce }

POST /api/game/sign-refund
Body: { recipient, nonce, contractAddress, chainId }
Response: { signature, nonce }
```

#### 4. **Frontend Hooks**
Located: `/frontend/client/src/hooks/`

- `useCompensate.js` - Orchestrates compensation flow
- `useRefund.js` - Orchestrates refund flow

**Flow:**
1. Request signature from backend API
2. Call contract's `compensate()` or `refund()` function
3. Wait for transaction confirmation
4. Display success/error toast

#### 5. **UI Components**
Located: `/frontend/client/src/components/`

- `CompensationPrompt.jsx` - Shows compensation claim button for winners
- `DepositPrompt.jsx` - Handles stake approval, staking, and refund claims

## Setup Instructions

### 1. Backend Configuration

Create `.env` file in `/frontend/server/`:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dotrust
PORT=5001
NODE_ENV=development
JWT_SECRET=your-secret-key

# ECDSA Signing - CRITICAL FOR PRODUCTION
PRIVATE_KEY=0x...owner's-private-key-in-hex...
CHAT_CONTRACT_ADDRESS=0x...deployed-chat-contract...
CHAIN_ID=80002
RPC_URL=https://rpc-amoy.polygon.technology
```

**Important:** The `PRIVATE_KEY` should be:
- The private key of the account that deployed the Chat contract (owner)
- Never committed to version control
- Stored securely in production (use secrets manager)

### 2. Frontend Configuration

Create `.env.local` file in `/frontend/client/`:
```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_CHAT_CONTRACT_ADDRESS=0x...deployed-chat-contract...
VITE_TOKEN_CONTRACT_ADDRESS=0x...deployed-dtt-token...
VITE_MINT_CONTRACT_ADDRESS=0x...deployed-mint-faucet...
VITE_CHAIN_ID=80002
VITE_RPC_URL=https://rpc-amoy.polygon.technology
```

### 3. Contract Deployment

Before using ECDSA signatures, deploy contracts:

```bash
cd contract

# Deploy Token
forge script script/Token.s.sol --rpc-url https://rpc-amoy.polygon.technology --private-key $PRIVATE_KEY --broadcast

# Deploy Mint
forge script script/Mint.s.sol --rpc-url https://rpc-amoy.polygon.technology --private-key $PRIVATE_KEY --broadcast

# Deploy Chat
forge script script/Chat.s.sol --rpc-url https://rpc-amoy.polygon.technology --private-key $PRIVATE_KEY --broadcast
```

Save the deployed contract addresses and update `.env` files.

## User Flow

### Compensation Flow (When User Wins)

1. **Timer Expires** → User wins the round
2. **Compensation Available** → UI shows "Claim Compensation" button
3. **User Clicks Button**:
   - Generate unique nonce (timestamp)
   - Request signature from backend
   - Backend signs with owner's private key
   - Submit `compensate()` tx with signature
   - Contract verifies signature and transfers $5
4. **Success** → User receives $5 compensation

### Refund Flow (When Opponent Never Staked)

1. **Refund Timer Expires** → Opponent didn't stake back
2. **Refund Available** → UI shows "Claim Refund" button
3. **User Clicks Button**:
   - Generate unique nonce
   - Request signature from backend
   - Backend signs with owner's private key
   - Submit `refund()` tx with signature
   - Contract verifies signature and transfers $3 refund
4. **Success** → User receives $3 refund

## Security Considerations

### 1. Signature Verification
- Signatures are verified against the contract owner's address
- Only the owner can sign valid compensation/refund messages
- Invalid signatures are rejected by the contract

### 2. Replay Protection
- Each signature includes a unique `nonce` (timestamp)
- Used signatures are tracked in `usedSignatures` mapping
- Same signature cannot be used twice (prevents replay attacks)

### 3. Message Integrity
- Messages include:
  - Recipient address (prevents transferring to wrong address)
  - Amount (5 for compensation, 3 for refund)
  - Contract address (chain-specific)
  - Chain ID (prevents cross-chain attacks)

### 4. Private Key Security
- **CRITICAL**: Store `PRIVATE_KEY` securely
- Never commit to Git
- Use environment variables or secrets managers
- Rotate regularly in production
- Consider using hardware wallets or key management services

## Verification & Testing

### Test Compensation Flow
```javascript
// 1. Ensure user has DTT tokens
// 2. Approve staking amount
// 3. Stake tokens
// 4. Wait for opponent to stake (or timer to expire)
// 5. Click "Claim Compensation"
// 6. Verify transaction on block explorer
```

### Test Refund Flow
```javascript
// 1. Approve and stake tokens
// 2. Send messages (so chat has history)
// 3. Wait 1+ minute without opponent staking back
// 4. Click "Claim Refund"
// 5. Verify transaction on block explorer
```

### Check Signature Validity
```javascript
// Backend: Generate signature
const signature = signCompensationMessage(
  recipient,
  nonce,
  contractAddress,
  chainId,
  privateKey
);

// Frontend: Submit and verify on-chain
// Contract's recover() will validate the signature
```

## Common Issues

### Issue: "Invalid signature"
**Cause:** Message hash doesn't match contract's expectation
**Solution:**
- Verify contract address and chain ID match
- Check that amounts match (5 for compensation, 3 for refund)
- Ensure recipient address is correct

### Issue: "Signature already used"
**Cause:** Same signature was submitted twice
**Solution:**
- Each claim needs a unique nonce
- Frontend generates new nonce automatically (uses timestamp)
- Don't reuse old signatures

### Issue: "Transaction reverted: unauthorized"
**Cause:** Backend signed with wrong private key
**Solution:**
- Verify `PRIVATE_KEY` is from contract owner account
- Check that contract owner matches signer account

### Issue: Backend can't sign
**Cause:** `PRIVATE_KEY` not configured in `.env`
**Solution:**
- Add `PRIVATE_KEY` to backend `.env`
- Restart backend server

## Future Improvements

1. **Nonce Management**: Instead of timestamp, use per-user nonce counter to prevent timing issues
2. **Signature Expiration**: Add validity window so signatures expire after certain period
3. **Multi-sig**: Require multiple signatures for additional security
4. **Key Rotation**: Implement key rotation mechanism
5. **Audit Logging**: Log all signatures and claims for auditing

## References

- [OpenZeppelin ECDSA Documentation](https://docs.openzeppelin.com/contracts/latest/api/utils#ECDSA)
- [EIP-191: Signed Data Standard](https://eips.ethereum.org/EIPS/eip-191)
- [Ethers.js Signing Documentation](https://docs.ethers.org/v6/api/wallet/#Wallet-sign)
- [Solidity Signature Verification](https://solidity-by-example.org/signature/)
