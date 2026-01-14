# Deployment Ready Checklist

## Overview
This checklist ensures all components are properly configured before deploying the ECDSA signature system to production.

## ✅ Pre-Deployment Verification

### Smart Contracts
- [ ] `Chat.sol` deployed on Polygon Amoy (testnet) or mainnet
  - [ ] Contract address saved
  - [ ] Constructor initialized with Token address
  - [ ] Owner set correctly
- [ ] `Token.sol` (DTT) deployed and verified
  - [ ] Contract address saved
  - [ ] Initial supply minted to treasury
  - [ ] Decimals confirmed (18)
- [ ] `Mint.sol` faucet deployed
  - [ ] Contract address saved
  - [ ] Token contract linked correctly
  - [ ] Initial tokens funded

### Backend Configuration
- [ ] `.env` file created from `.env.sample`
  - [ ] `MONGODB_URI` - Database connection string
  - [ ] `PORT` - Server port (default 5001)
  - [ ] `JWT_SECRET` - Unique secret key
  - [ ] `NODE_ENV` - Set to "development" or "production"
  - [ ] `CLOUDINARY_*` - Image upload service (optional)
  - [ ] `PRIVATE_KEY` - Owner's private key (from deployment account)
    - [ ] Format: 0x followed by 64 hex characters
    - [ ] Is the account that deployed Chat.sol
    - [ ] Not committed to Git
    - [ ] Stored securely
  - [ ] `CHAT_CONTRACT_ADDRESS` - Deployed Chat contract address
    - [ ] Correct format (0x followed by 40 hex characters)
    - [ ] Matches actual deployment
  - [ ] `CHAIN_ID` - 80002 for Polygon Amoy, or mainnet value
  - [ ] `RPC_URL` - Valid RPC endpoint for chain

### Frontend Configuration
- [ ] `.env.local` created from `.env.sample`
  - [ ] `VITE_API_BASE_URL` - Backend API URL
    - [ ] Development: `http://localhost:5001/api`
    - [ ] Production: Your deployed backend URL (must have HTTPS)
  - [ ] `VITE_CHAT_CONTRACT_ADDRESS` - Chat contract address
    - [ ] Matches backend configuration
    - [ ] Correct for the chain you're using
  - [ ] `VITE_TOKEN_CONTRACT_ADDRESS` - Token contract address
    - [ ] Matches actual deployment
  - [ ] `VITE_MINT_CONTRACT_ADDRESS` - Mint contract address
    - [ ] Matches actual deployment
  - [ ] `VITE_CHAIN_ID` - 80002 for Amoy or mainnet ID
  - [ ] `VITE_RPC_URL` - Valid RPC endpoint
    - [ ] Corresponds to VITE_CHAIN_ID

### Environment Variables Validation
Run this to verify all required variables are set:

```bash
# Backend
cd frontend/server
echo "MONGODB_URI=${MONGODB_URI:?MISSING}" && \
echo "PORT=${PORT:?MISSING}" && \
echo "JWT_SECRET=${JWT_SECRET:?MISSING}" && \
echo "PRIVATE_KEY=${PRIVATE_KEY:?MISSING}" && \
echo "CHAT_CONTRACT_ADDRESS=${CHAT_CONTRACT_ADDRESS:?MISSING}" && \
echo "CHAIN_ID=${CHAIN_ID:?MISSING}"

# Frontend
cd ../client
echo "VITE_API_BASE_URL=${VITE_API_BASE_URL:?MISSING}" && \
echo "VITE_CHAT_CONTRACT_ADDRESS=${VITE_CHAT_CONTRACT_ADDRESS:?MISSING}" && \
echo "VITE_TOKEN_CONTRACT_ADDRESS=${VITE_TOKEN_CONTRACT_ADDRESS:?MISSING}" && \
echo "VITE_CHAIN_ID=${VITE_CHAIN_ID:?MISSING}"
```

### Dependencies Installation
- [ ] Backend dependencies installed
  ```bash
  cd frontend/server
  npm install
  ```
  - [ ] ethers.js installed (for signing)
  - [ ] express installed
  - [ ] mongoose installed
  - [ ] dotenv installed

- [ ] Frontend dependencies installed
  ```bash
  cd frontend/client
  npm install
  ```
  - [ ] wagmi installed (wallet connection)
  - [ ] viem installed (blockchain interaction)
  - [ ] ethers installed
  - [ ] react-hot-toast installed
  - [ ] sonner installed (for notifications)

### Network Configuration
- [ ] MetaMask/wallet configured for Polygon Amoy
  - [ ] Network added: https://rpc-amoy.polygon.technology
  - [ ] Chain ID: 80002
  - [ ] Currency: MATIC

- [ ] Test tokens available
  - [ ] Get test MATIC from faucet: https://faucet.polygon.technology/
  - [ ] Verify wallet has MATIC for gas fees
  - [ ] Test DTT tokens available (from Mint faucet)

### Contract Functionality Verification
- [ ] Test `stake()` function
  - [ ] User can approve token spending
  - [ ] User can stake 3 tokens
  - [ ] Event `Staked` emitted
  - [ ] Tokens deducted from user wallet

- [ ] Test `compensate()` function
  - [ ] Backend can sign compensation message
  - [ ] User can submit compensation transaction
  - [ ] Contract verifies signature correctly
  - [ ] User receives 5 tokens
  - [ ] Event `Compensated` emitted
  - [ ] Platform earns 1 token fee

- [ ] Test `refund()` function
  - [ ] Backend can sign refund message
  - [ ] User can submit refund transaction
  - [ ] Contract verifies signature correctly
  - [ ] User receives 3 tokens (stake back)
  - [ ] Event `Refunded` emitted

- [ ] Test Replay Protection
  - [ ] First signature works
  - [ ] Same signature rejected on second use
  - [ ] Error message: "Signature already used"

### API Endpoints Verification
- [ ] Backend running on configured port
  ```bash
  npm start
  ```
  - [ ] Server logs show "server is running on PORT: 5001"
  - [ ] Database connected successfully

- [ ] Test `/api/game/sign-compensate` endpoint
  ```bash
  curl -X POST http://localhost:5001/api/game/sign-compensate \
    -H "Content-Type: application/json" \
    -d '{
      "recipient": "0xYourAddress",
      "nonce": 1234567890,
      "contractAddress": "0xContractAddress",
      "chainId": 80002
    }'
  ```
  - [ ] Returns signature in response
  - [ ] Signature is valid format

- [ ] Test `/api/game/sign-refund` endpoint
  ```bash
  curl -X POST http://localhost:5001/api/game/sign-refund \
    -H "Content-Type: application/json" \
    -d '{
      "recipient": "0xYourAddress",
      "nonce": 1234567891,
      "contractAddress": "0xContractAddress",
      "chainId": 80002
    }'
  ```
  - [ ] Returns signature in response

### Frontend Functionality Verification
- [ ] Frontend running
  ```bash
  npm run dev
  ```
  - [ ] App loads without errors
  - [ ] No console errors

- [ ] Wallet connection works
  - [ ] Can connect MetaMask
  - [ ] Correct account displayed
  - [ ] Correct network displayed

- [ ] Compensation flow works
  - [ ] "Claim Compensation" button appears for winners
  - [ ] Button triggers signature request
  - [ ] Transaction submitted after signature received
  - [ ] Toast shows success/error

- [ ] Refund flow works
  - [ ] "Claim Refund" button appears when eligible
  - [ ] Button triggers refund flow
  - [ ] Transaction submitted after signature
  - [ ] Toast shows success/error

### Security Checks
- [ ] Private key is NOT in `.env` committed to Git
  - [ ] Check `.gitignore` includes `.env`
  - [ ] Check `.env` is not in Git history

- [ ] Private key is NOT logged anywhere
  - [ ] Backend doesn't log PRIVATE_KEY
  - [ ] Frontend doesn't receive private key
  - [ ] No secret keys in error messages

- [ ] HTTPS enforced (production)
  - [ ] Backend API accessible only via HTTPS
  - [ ] Certificate is valid
  - [ ] No mixed HTTP/HTTPS content

- [ ] CORS properly configured
  - [ ] Backend CORS allows frontend origin
  - [ ] Only necessary origins allowed
  - [ ] Credentials enabled for auth

- [ ] Rate limiting implemented (recommended)
  - [ ] `/api/game/sign-compensate` rate limited
  - [ ] `/api/game/sign-refund` rate limited
  - [ ] Prevents signature spam

### Database Verification
- [ ] MongoDB connection working
  - [ ] Connection string is valid
  - [ ] Database exists and is accessible
  - [ ] Collections can be created

- [ ] User and game data can be stored
  - [ ] Users can sign up
  - [ ] Chat games can be created
  - [ ] Game state persists

### Testing Checklist
Complete these test scenarios before going live:

#### Test 1: Complete Compensation Flow
- [ ] User A and B both stake 3 tokens each
- [ ] Both users have approved token spending
- [ ] Game starts with 60-second timer
- [ ] User A allows timer to expire (doesn't respond)
- [ ] User B clicks "Claim Compensation"
- [ ] Backend signs compensation message
- [ ] Transaction submitted successfully
- [ ] User B receives 5 tokens
- [ ] Check on block explorer: Compensated event emitted
- [ ] Try to claim again with same signature → Fails with "Signature already used"

#### Test 2: Complete Refund Flow
- [ ] User C stakes 3 tokens
- [ ] User D never stakes
- [ ] User C sends messages in chat
- [ ] Wait for refund timer to expire (60+ seconds)
- [ ] User C clicks "Claim Refund"
- [ ] Backend signs refund message
- [ ] Transaction submitted successfully
- [ ] User C receives 3 tokens back (stake refunded)
- [ ] Check on block explorer: Refunded event emitted

#### Test 3: Error Handling
- [ ] Disconnect wallet → Proper error message
- [ ] Missing contract address → Proper error message
- [ ] Insufficient gas → Proper error message
- [ ] Invalid signature → Contract rejects
- [ ] Missing PRIVATE_KEY → Backend error
- [ ] Wrong chain ID → Signature doesn't validate

#### Test 4: Cross-Chain Prevention
- [ ] Sign with one chain ID
- [ ] Try to submit on different chain
- [ ] Transaction fails (signature invalid)

### Performance Checks
- [ ] Backend response time acceptable
  - [ ] `/api/game/sign-compensate` < 1 second
  - [ ] `/api/game/sign-refund` < 1 second

- [ ] Transaction gas costs reasonable
  - [ ] Compensation transaction gas ≈ 100k-150k
  - [ ] Refund transaction gas ≈ 100k-150k

- [ ] Frontend loads quickly
  - [ ] Initial load < 3 seconds
  - [ ] No blocking operations on main thread

### Monitoring & Logging
- [ ] Backend logs are being collected
  - [ ] Server startup logged
  - [ ] Errors logged
  - [ ] Signatures signed logged (without key details)

- [ ] Frontend error tracking enabled
  - [ ] Errors sent to logging service (Sentry, LogRocket, etc.)
  - [ ] User interactions tracked

- [ ] Monitor contract transactions
  - [ ] All Compensated events logged
  - [ ] All Refunded events logged
  - [ ] All stake transactions monitored

## 📋 Final Verification

Before marking as "Ready to Deploy":

- [ ] All checkboxes above are completed
- [ ] All environment variables verified
- [ ] All tests passed
- [ ] No errors in console
- [ ] No security issues found
- [ ] Private key is secure
- [ ] Team has reviewed configuration
- [ ] Deployment plan documented
- [ ] Rollback plan prepared
- [ ] User documentation ready

## 🚀 Deployment Steps

1. **Deploy Backend**
   ```bash
   cd frontend/server
   # Ensure .env is configured
   npm install
   npm start
   # Or use PM2/Docker for production
   ```

2. **Deploy Frontend**
   ```bash
   cd frontend/client
   # Ensure .env.local is configured
   npm install
   npm run build
   # Deploy dist/ folder to hosting
   ```

3. **Verify Deployment**
   - [ ] Backend responding to requests
   - [ ] Frontend loading from correct origin
   - [ ] API calls reaching backend
   - [ ] Signature endpoints working
   - [ ] Smart contracts accessible

4. **Post-Deployment**
   - [ ] Monitor error logs
   - [ ] Check user transactions
   - [ ] Verify compensation/refund flows
   - [ ] Monitor gas prices
   - [ ] Be ready to rollback if issues

## 🆘 Rollback Plan

If critical issues are discovered post-deployment:

1. **Pause Contract** (if owner capability)
   ```solidity
   owner.pause() // Stops stake/compensate/refund
   ```

2. **Revert Backend**
   - Stop current backend
   - Switch to previous version
   - Restart with verified configuration

3. **Revert Frontend**
   - Revert to previous deployment
   - Clear browser cache
   - Inform users of issue

4. **Investigate**
   - Review logs
   - Check transaction history
   - Identify root cause
   - Fix and redeploy

## ✅ Success Criteria

Deployment is successful when:
1. Users can claim compensation with valid signatures
2. Users can claim refunds with valid signatures
3. All transactions confirmed on-chain
4. No security issues discovered
5. Performance meets requirements
6. Error handling works properly
7. Team confident in system

---

**Date Prepared:** January 14, 2026
**System:** DoTrust ECDSA Signature Implementation
**Status:** Ready for Production Deployment
