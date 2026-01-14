# ECDSA Implementation - Quick Start Guide

## What's Been Implemented

✅ **Smart Contract (Chat.sol)**
- ECDSA signature verification for compensation and refund
- Replay protection with `usedSignatures` mapping
- Proper message hashing with contract address and chain ID

✅ **Backend Signing Service (signer.js)**
- `signCompensationMessage()` - Signs compensation requests
- `signRefundMessage()` - Signs refund requests
- Proper Eth signed message formatting

✅ **Backend API Endpoints (game.route.js)**
- `POST /api/game/sign-compensate` - Request compensation signature
- `POST /api/game/sign-refund` - Request refund signature

✅ **Frontend Hooks**
- `useCompensate.js` - Complete compensation flow
- `useRefund.js` - Complete refund flow
- Proper error handling and toast notifications

✅ **Frontend Components**
- `CompensationPrompt.jsx` - Winner compensation claim UI
- `DepositPrompt.jsx` - Stake, approve, and refund UI

✅ **Environment Configuration**
- `.env.sample` files for both backend and frontend
- Documentation of required variables

## Next Steps for Deployment

### 1. **Deploy Smart Contracts**
```bash
cd contract

# Set your private key
export PRIVATE_KEY=0x...

# Deploy to Polygon Amoy testnet
forge script script/Token.s.sol \
  --rpc-url https://rpc-amoy.polygon.technology \
  --private-key $PRIVATE_KEY \
  --broadcast

forge script script/Mint.s.sol \
  --rpc-url https://rpc-amoy.polygon.technology \
  --private-key $PRIVATE_KEY \
  --broadcast

forge script script/Chat.s.sol \
  --rpc-url https://rpc-amoy.polygon.technology \
  --private-key $PRIVATE_KEY \
  --broadcast
```

### 2. **Configure Backend (.env)**
```bash
cd frontend/server

# Copy sample and fill in values
cp .env.sample .env

# Edit .env with:
# - PRIVATE_KEY (from deployment account)
# - CHAT_CONTRACT_ADDRESS (from Chat deployment)
# - MongoDB connection string
# - Other required variables
```

### 3. **Configure Frontend (.env.local)**
```bash
cd frontend/client

# Create .env.local with:
# - VITE_CHAT_CONTRACT_ADDRESS (from Chat deployment)
# - VITE_TOKEN_CONTRACT_ADDRESS (from Token deployment)
# - VITE_MINT_CONTRACT_ADDRESS (from Mint deployment)
# - API base URL
```

### 4. **Start Services**
```bash
# Backend (from frontend/server)
npm install
npm start

# Frontend (from frontend/client)
npm install
npm run dev
```

## Testing the Implementation

### Test Flow:
1. **Get Tokens**
   - Visit Mint page
   - Click "Claim 15 Tokens" (gets 15 DTT)

2. **Approve Staking**
   - Go to chat with another user
   - Click "Approve Token Spending"
   - Approve 10+ tokens

3. **Stake Tokens**
   - Click "Stake 3 Tokens"
   - Confirm transaction
   - Wait for opponent to stake

4. **Chat & Compete**
   - Send messages
   - Timer starts when both have staked
   - First to respond gets 1 minute countdown

5. **Claim Compensation/Refund**
   - If opponent doesn't respond → "Claim Compensation ($5)"
   - If opponent never stakes → "Claim Refund ($3)"
   - Backend signs transaction
   - Contract verifies signature and transfers tokens

## Key Files Modified

- ✅ `/frontend/client/src/components/CompensationPrompt.jsx` - Uncommented compensation flow
- ✅ `/frontend/server/.env.sample` - Added ECDSA configuration
- ✅ `/frontend/client/.env.sample` - Created with contract addresses
- ✅ `/ECDSA_SIGNATURE_IMPLEMENTATION.md` - Detailed documentation

## Security Reminders

⚠️ **CRITICAL for Production:**
1. Never commit `.env` files with `PRIVATE_KEY`
2. Use secrets manager (AWS Secrets, HashiCorp Vault, etc.)
3. Rotate private keys regularly
4. Use hardware wallets for signing in production
5. Monitor all compensation/refund transactions
6. Consider rate limiting on signature endpoints

## Verification

To verify ECDSA is working:
1. Check backend logs when signing compensation
2. Verify transaction on Polygon Amoy explorer
3. Confirm contract events (Compensated/Refunded)
4. Check that same signature can't be reused

## Troubleshooting

**Q: "Invalid signature" error**
A: Ensure recipient address, contract address, and chain ID match exactly

**Q: Backend won't start**
A: Check all required env vars are set (especially PRIVATE_KEY)

**Q: Compensation button doesn't work**
A: Verify contract address in frontend .env matches deployment

**Q: Transaction keeps failing**
A: Check contract has enough DTT tokens to distribute

See `ECDSA_SIGNATURE_IMPLEMENTATION.md` for detailed troubleshooting.
