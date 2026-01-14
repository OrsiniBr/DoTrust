# ECDSA Flow Diagrams

## Compensation Flow

```
COMPENSATION FLOW
═════════════════════════════════════════════════════════════════════

1. SETUP PHASE
   ┌─────────────────────────────────────────────────────────────┐
   │ User A                              User B                  │
   │ ┌──────────────────┐                                        │
   │ │ Approve tokens   │                                        │
   │ └────────┬─────────┘                                        │
   │          │                                                  │
   │          ├─→ approve() → Chat contract                      │
   │          │                                                  │
   │ ┌────────▼─────────┐                                        │
   │ │ Stake 3 tokens   │                                        │
   │ └────────┬─────────┘                                        │
   │          │                                                  │
   │          ├─→ stake() → Chat contract                        │
   │          │                                                  │
   │          │                    ┌──────────────────┐          │
   │          │                    │ Approve tokens   │          │
   │          │                    └────────┬─────────┘          │
   │          │                             │                   │
   │          │                             ├─→ approve()       │
   │          │                             │                   │
   │          │                    ┌────────▼─────────┐          │
   │          │                    │ Stake 3 tokens   │          │
   │          │                    └────────┬─────────┘          │
   │          │                             │                   │
   │          │                             ├─→ stake()         │
   │          │◄────────── Both staked! ────┤                   │
   │          │                                                  │
   │          │ TIMER STARTS (60 seconds)                        │
   │          │                                                  │
   │          ├──────────────────────────────────────►          │
   │          │ (60s count down)                                │
   │          │                                                  │
   │ ┌────────▼─────────┐        ┌──────────────────┐           │
   │ │ WAITING FOR      │        │ RESPONDS QUICKLY │           │
   │ │ RESPONSE FROM B  │        │ (sends message)  │           │
   │ │                  │        │                  │           │
   │ │ A does NOT       │        │ B sends reply    │           │
   │ │ respond          │        │ within time      │           │
   │ └──────────────────┘        └──────────────────┘           │
   └─────────────────────────────────────────────────────────────┘

2. TIMER EXPIRATION (A didn't respond, A WINS)
   ┌─────────────────────────────────────────────────────────────┐
   │                                                             │
   │ Timer expires → A is the WINNER                            │
   │                                                             │
   │ Contract state: game.winner = A's address                  │
   │                 game.state = "ended"                       │
   │                                                             │
   └─────────────────────────────────────────────────────────────┘

3. COMPENSATION CLAIM (A claims $5)
   ┌─────────────────────────────────────────────────────────────┐
   │                                                             │
   │ Frontend: A clicks "Claim Compensation" button             │
   │ ┌────────────────────────────────────────────────────────┐ │
   │ │ const nonce = Date.now()  // Unique identifier         │ │
   │ │ const recipient = A's address                          │ │
   │ │                                                        │ │
   │ │ HTTP POST to /api/game/sign-compensate               │ │
   │ │ {                                                      │ │
   │ │   recipient: "0xAA...",                              │ │
   │ │   nonce: 1705221600000,                              │ │
   │ │   contractAddress: "0xCC...",                         │ │
   │ │   chainId: 80002                                      │ │
   │ │ }                                                      │ │
   │ └────────────────────────────────────────────────────────┘ │
   │                            │                                │
   │                            ▼                                │
   │ Backend: Receives signature request                        │
   │ ┌────────────────────────────────────────────────────────┐ │
   │ │ messageHash = keccak256(                               │ │
   │ │   abi.encodePacked(                                    │ │
   │ │     recipient,          // 0xAA...                    │ │
   │ │     nonce,              // 1705221600000              │ │
   │ │     COMPENSATE_AMOUNT,  // 5 * 1e18                   │ │
   │ │     contractAddress,    // 0xCC...                    │ │
   │ │     chainId             // 80002                      │ │
   │ │   )                                                    │ │
   │ │ )                                                      │ │
   │ │                                                        │ │
   │ │ ethSignedHash = MessageHashUtils.toEthSignedMessageHash│ │
   │ │                 (messageHash)                          │ │
   │ │                                                        │ │
   │ │ signature = OWNER_WALLET.sign(ethSignedHash)          │ │
   │ │              using PRIVATE_KEY                         │ │
   │ │                                                        │ │
   │ │ Return: { signature: "0x...", nonce: 1705221600000 }  │ │
   │ └────────────────────────────────────────────────────────┘ │
   │                            │                                │
   │                            ▼                                │
   │ Frontend: Receives signature from backend                 │
   │ ┌────────────────────────────────────────────────────────┐ │
   │ │ Call Chat contract:                                     │ │
   │ │ compensate(                                             │ │
   │ │   recipient = "0xAA...",       // A's address          │ │
   │ │   nonce = 1705221600000,                               │ │
   │ │   signature = "0x..."          // Owner's signature    │ │
   │ │ )                                                       │ │
   │ │                                                        │ │
   │ │ Transaction submitted to blockchain                   │ │
   │ └────────────────────────────────────────────────────────┘ │
   │                            │                                │
   │                            ▼                                │
   │ Smart Contract: Verifies and executes                     │
   │ ┌────────────────────────────────────────────────────────┐ │
   │ │ 1. Verify signature not already used                   │ │
   │ │    require(!usedSignatures[messageHash])               │ │
   │ │                                                        │ │
   │ │ 2. Recover signer address from signature               │ │
   │ │    recoveredSigner = ECDSA.recover(                    │ │
   │ │      ethSignedHash,                                    │ │
   │ │      signature                                         │ │
   │ │    )                                                   │ │
   │ │    // Returns owner's address                          │ │
   │ │                                                        │ │
   │ │ 3. Verify recovered signer is contract owner           │ │
   │ │    require(recoveredSigner == owner())                 │ │
   │ │                                                        │ │
   │ │ 4. Mark signature as used (prevent replay)             │ │
   │ │    usedSignatures[messageHash] = true                  │ │
   │ │                                                        │ │
   │ │ 5. Add to contract profit                              │ │
   │ │    contractProfit += 1 * 1e18  // 1 token fee          │ │
   │ │                                                        │ │
   │ │ 6. Transfer 5 tokens to A                              │ │
   │ │    chatToken.safeTransfer(recipient, 5 * 1e18)         │ │
   │ │                                                        │ │
   │ │ 7. Emit event                                          │ │
   │ │    emit Compensated(recipient, 5*1e18, 1*1e18)         │ │
   │ └────────────────────────────────────────────────────────┘ │
   │                            │                                │
   │                            ▼                                │
   │ Frontend: Transaction confirmed                           │
   │ ┌────────────────────────────────────────────────────────┐ │
   │ │ ✅ Success!                                             │ │
   │ │ User A received 5 tokens                                │ │
   │ │ Platform earned 1 token fee                             │ │
   └─────────────────────────────────────────────────────────────┘

FINAL STATE:
  A's Balance: +5 tokens
  B's Balance: -3 tokens (lost stake, no compensation)
  Platform: +1 token fee
```

## Refund Flow

```
REFUND FLOW
═════════════════════════════════════════════════════════════════════

1. INITIAL STAKE (only User A stakes)
   ┌─────────────────────────────────────────────────────────────┐
   │ User A                              User B                  │
   │ ┌──────────────────┐                                        │
   │ │ Approve tokens   │                                        │
   │ └────────┬─────────┘                                        │
   │          │                                                  │
   │          ├─→ approve()                                      │
   │          │                                                  │
   │ ┌────────▼─────────┐                                        │
   │ │ Stake 3 tokens   │                                        │
   │ └────────┬─────────┘                                        │
   │          │                                                  │
   │          ├─→ stake()                                        │
   │          │                                                  │
   │          │ REFUND TIMER STARTS (60 seconds)                │
   │          │ (waiting for B to stake back)                   │
   │          │                                                  │
   │          ├──────────────────────────────────────────────►  │
   │          │                                                  │
   │          │ A sends messages                     B never     │
   │          │ ┌──────────────────────┐            stakes back │
   │          │ │ "Hi, how are you?"   │                        │
   │          │ │ "Let's chat"         │                        │
   │          │ │ "Are you there?"     │                        │
   │          │ └──────────────────────┘                        │
   │          │                                                  │
   │          │ (60s expires...)                                │
   │          │                                                  │
   │ ┌────────▼─────────────────────────────────────────────┐   │
   │ │ REFUND ELIGIBLE                                     │   │
   │ │ - A has staked                                      │   │
   │ │ - A has messages in chat                            │   │
   │ │ - B never staked back                               │   │
   │ │ - Refund timer has expired                          │   │
   │ └────────┬─────────────────────────────────────────────┘   │
   │          │                                                  │
   │          │ A clicks "Claim Refund" button                  │
   │          │                                                  │
   └──────────┼──────────────────────────────────────────────────┘
              │

2. REFUND CLAIM (A gets $3 back)
   ┌─────────────────────────────────────────────────────────────┐
   │                                                             │
   │ Frontend: A clicks "Claim Refund" button                   │
   │ ┌────────────────────────────────────────────────────────┐ │
   │ │ const nonce = Date.now()                               │ │
   │ │ const recipient = A's address                          │ │
   │ │                                                        │ │
   │ │ HTTP POST to /api/game/sign-refund                   │ │
   │ │ {                                                      │ │
   │ │   recipient: "0xAA...",                              │ │
   │ │   nonce: 1705221610000,                              │ │
   │ │   contractAddress: "0xCC...",                         │ │
   │ │   chainId: 80002                                      │ │
   │ │ }                                                      │ │
   │ └────────────────────────────────────────────────────────┘ │
   │                            │                                │
   │                            ▼                                │
   │ Backend: Signs refund message                             │
   │ ┌────────────────────────────────────────────────────────┐ │
   │ │ messageHash = keccak256(                               │ │
   │ │   abi.encodePacked(                                    │ │
   │ │     recipient,          // 0xAA...                    │ │
   │ │     nonce,              // 1705221610000              │ │
   │ │     STAKE_AMOUNT,       // 3 * 1e18 (not 5!)          │ │
   │ │     contractAddress,    // 0xCC...                    │ │
   │ │     chainId             // 80002                      │ │
   │ │   )                                                    │ │
   │ │ )                                                      │ │
   │ │                                                        │ │
   │ │ ethSignedHash = MessageHashUtils.toEthSignedMessageHash│ │
   │ │                 (messageHash)                          │ │
   │ │                                                        │ │
   │ │ signature = OWNER_WALLET.sign(ethSignedHash)          │ │
   │ │              using PRIVATE_KEY                         │ │
   │ │                                                        │ │
   │ │ Return: { signature: "0x...", nonce: 1705221610000 }  │ │
   │ └────────────────────────────────────────────────────────┘ │
   │                            │                                │
   │                            ▼                                │
   │ Frontend: Submits refund transaction                      │
   │ ┌────────────────────────────────────────────────────────┐ │
   │ │ Call Chat contract:                                     │ │
   │ │ refund(                                                 │ │
   │ │   recipient = "0xAA...",                              │ │
   │ │   nonce = 1705221610000,                               │ │
   │ │   signature = "0x..."                                 │ │
   │ │ )                                                       │ │
   │ │                                                        │ │
   │ │ Transaction submitted to blockchain                   │ │
   │ └────────────────────────────────────────────────────────┘ │
   │                            │                                │
   │                            ▼                                │
   │ Smart Contract: Verifies and executes                     │
   │ ┌────────────────────────────────────────────────────────┐ │
   │ │ 1. Verify signature not already used                   │ │
   │ │    require(!usedSignatures[messageHash])               │ │
   │ │                                                        │ │
   │ │ 2. Recover signer from signature                       │ │
   │ │    recoveredSigner = ECDSA.recover(...)                │ │
   │ │                                                        │ │
   │ │ 3. Verify recovered signer is owner                    │ │
   │ │    require(recoveredSigner == owner())                 │ │
   │ │                                                        │ │
   │ │ 4. Mark signature as used                              │ │
   │ │    usedSignatures[messageHash] = true                  │ │
   │ │                                                        │ │
   │ │ 5. Transfer 3 tokens back to A (refund)                │ │
   │ │    chatToken.safeTransfer(recipient, 3 * 1e18)         │ │
   │ │                                                        │ │
   │ │ 6. Emit event                                          │ │
   │ │    emit Refunded(recipient, 3*1e18)                    │ │
   │ └────────────────────────────────────────────────────────┘ │
   │                            │                                │
   │                            ▼                                │
   │ Frontend: Success!                                        │
   │ ┌────────────────────────────────────────────────────────┐ │
   │ │ ✅ Refund processed successfully!                       │ │
   │ │ A received 3 tokens back                                │ │
   │ │ A's original stake is refunded                          │ │
   └─────────────────────────────────────────────────────────────┘

FINAL STATE:
  A's Balance: -0 tokens (stake returned)
  B's Balance: 0 tokens (never staked)
  Platform: 0 tokens (no fee on refund)
```

## Signature Verification & Replay Protection

```
SIGNATURE VERIFICATION & REPLAY PROTECTION
═════════════════════════════════════════════════════════════════════

FIRST ATTEMPT (Successful)
───────────────────────────
User calls: compensate(recipient, nonce=123, signature="0x...")

Contract execution:
  1. messageHash = keccak256(abi.encodePacked(
       0xAA...,  // recipient
       123,      // nonce
       5*1e18,   // amount
       0xCC...,  // contract address
       80002     // chainId
     ))
     
  2. Check: !usedSignatures[messageHash]  → ✅ TRUE (not used yet)
     
  3. Recover signer:
     ethSignedHash = MessageHashUtils.toEthSignedMessageHash(messageHash)
     recoveredSigner = ECDSA.recover(ethSignedHash, signature)
     → recoveredSigner == 0xOWNER... ✅ VALID
     
  4. Mark as used:
     usedSignatures[messageHash] = true  // Prevents replay!
     
  5. Transfer tokens:
     ✅ SUCCESS - 5 tokens sent to user

SECOND ATTEMPT (Same signature - BLOCKED)
──────────────────────────────────────────
User tries again with SAME: compensate(recipient, nonce=123, signature="0x...")

Contract execution:
  1. messageHash = keccak256(...)  → Same hash as before
     
  2. Check: !usedSignatures[messageHash]  → ❌ FALSE (already used!)
     
  3. Revert with: "Signature already used"
     
  ❌ FAILED - Transaction reverted, no tokens transferred

DIFFERENT NONCE (New attempt)
─────────────────────────────
User tries: compensate(recipient, nonce=124, signature="0xNEW...")

Contract execution:
  1. messageHash = keccak256(abi.encodePacked(
       0xAA...,  // recipient
       124,      // DIFFERENT nonce!
       5*1e18,
       0xCC...,
       80002
     ))
     → DIFFERENT hash than before
     
  2. Check: !usedSignatures[messageHash]  → ✅ TRUE (new hash)
     
  3. But signature "0xNEW..." was signed with nonce=123, not 124
     recoveredSigner = ECDSA.recover(...)
     → Doesn't match owner's signature ❌ INVALID
     
  4. Revert with: "Invalid signature"
     
  ❌ FAILED - Transaction reverted

KEY SECURITY FEATURES:
═════════════════════
✅ Nonce-based uniqueness: Different nonce = Different message = Different signature needed
✅ Replay protection: Used signatures tracked and rejected on second use
✅ Signature validation: Only valid owner signatures accepted
✅ Chain protection: Different chain IDs create different message hashes
✅ Amount protection: Signature tied to specific amount (5 for compensation, 3 for refund)
✅ Recipient protection: Signature tied to specific recipient address
```

## Message Hash Construction

```
MESSAGE HASH CONSTRUCTION
═════════════════════════════════════════════════════════════════════

COMPENSATION MESSAGE
────────────────────
Components packed together (in order):
  1. recipient       - User's wallet address          (20 bytes)
  2. nonce           - Unique identifier (timestamp)   (32 bytes)
  3. COMPENSATE_AMOUNT - 5 tokens in wei              (32 bytes)
  4. contractAddress - Chat contract address          (20 bytes)
  5. chainId         - Polygon Amoy: 80002            (32 bytes)

Example:
  recipient = 0xAA11111111111111111111111111111111111111
  nonce = 1705221600000
  COMPENSATE_AMOUNT = 5000000000000000000
  contractAddress = 0xCC22222222222222222222222222222222222222
  chainId = 80002

  ↓ Packed together in ABI format

  messageHash = keccak256(0xAA11...CC22...80002...)

  ↓ Convert to Ethereum signed message hash

  ethSignedHash = keccak256(
    "\x19Ethereum Signed Message:\n32" + messageHash
  )

  ↓ Sign with owner's private key

  signature = sign(ethSignedHash)
              using OWNER_PRIVATE_KEY
              
  ↓ Signature format: r || s || v
  
  r = first 32 bytes of signature
  s = next 32 bytes of signature
  v = recovery ID (27 or 28, indicating which of 4 possible public keys)


REFUND MESSAGE
──────────────
Same structure, but with STAKE_AMOUNT (3 tokens) instead of COMPENSATE_AMOUNT:
  1. recipient
  2. nonce
  3. STAKE_AMOUNT (3 * 1e18) ← Different amount!
  4. contractAddress
  5. chainId

This is why refund and compensation signatures are different:
  - Different amount → Different hash
  - Different hash → Requires different signature
  - Backend checks which function was called and signs accordingly
```

---

## Key Takeaways

1. **Nonce ensures uniqueness**: Every claim needs a unique nonce (usually timestamp)
2. **Replay protection prevents abuse**: Same signature cannot be used twice
3. **Message includes context**: Amount, recipient, contract, chain are all signed
4. **Only owner can sign**: Only the contract owner's private key creates valid signatures
5. **Signature validation is cryptographic**: Mathematically impossible to forge or modify
