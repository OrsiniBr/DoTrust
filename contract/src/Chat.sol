//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract Chat is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable chatToken;

    event Staked(address indexed user, uint256 tokenAmount);
    event StakedViaRelayer(address indexed user, uint256 tokenAmount, address relayer);
    event Compensated(address indexed recipient, uint256 compensationAmount, uint256 contractFee);
    event Refunded(address indexed recipient, uint256 refundAmount);
    event ProfitWithdrawn(address indexed owner, uint256 amount);

    uint256 public constant STAKE_AMOUNT = 3 * 1e18;
    uint256 public constant COMPENSATE_AMOUNT = 5 * 1e18;
    uint256 public constant CONTRACT_FEE = 1 * 1e18;
    
    uint256 public contractProfit;
    mapping(bytes32 => bool) public usedSignatures;
    
    // Track nonces per user for meta-transactions
    mapping(address => uint256) public nonces;

    constructor(address _chatToken) Ownable(msg.sender) {
        require(_chatToken != address(0), "Invalid token address");
        chatToken = IERC20(_chatToken);
    }

    // =========================================================================
    // REGULAR FUNCTIONS (User pays gas)
    // =========================================================================

    function stake() external nonReentrant whenNotPaused {
        chatToken.safeTransferFrom(msg.sender, address(this), STAKE_AMOUNT);
        emit Staked(msg.sender, STAKE_AMOUNT);
    }

    function compensate(
        address recipient, 
        uint256 nonce, 
        bytes calldata signature
    ) external nonReentrant {
        require(recipient != address(0), "Invalid recipient");

        bytes32 messageHash = keccak256(
            abi.encodePacked(
                recipient,
                nonce,
                COMPENSATE_AMOUNT,
                address(this),
                block.chainid
            )
        );

        require(!usedSignatures[messageHash], "Signature already used");

        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address recoveredSigner = ECDSA.recover(ethSignedMessageHash, signature);
        require(recoveredSigner == owner(), "Invalid signature");

        usedSignatures[messageHash] = true;
        contractProfit += CONTRACT_FEE;
        chatToken.safeTransfer(recipient, COMPENSATE_AMOUNT);

        emit Compensated(recipient, COMPENSATE_AMOUNT, CONTRACT_FEE);
    }

    function refund(
        address recipient, 
        uint256 nonce, 
        bytes calldata signature
    ) external nonReentrant {
        require(recipient != address(0), "Invalid recipient");

        bytes32 messageHash = keccak256(
            abi.encodePacked(
                recipient,
                nonce,
                STAKE_AMOUNT,
                address(this),
                block.chainid
            )
        );

        require(!usedSignatures[messageHash], "Signature already used");

        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address recoveredSigner = ECDSA.recover(ethSignedMessageHash, signature);
        require(recoveredSigner == owner(), "Invalid signature");

        usedSignatures[messageHash] = true;
        chatToken.safeTransfer(recipient, STAKE_AMOUNT);

        emit Refunded(recipient, STAKE_AMOUNT);
    }

    // =========================================================================
    // META-TRANSACTION FUNCTIONS (Relayer pays gas)
    // =========================================================================

    /**
     * @dev Stake via relayer (gasless for user)
     * @param user The user who wants to stake
     * @param nonce User's current nonce
     * @param signature User's signature approving the stake
     * 
     * Flow:
     * 1. User signs message off-chain (no gas)
     * 2. User sends signature to relayer backend
     * 3. Relayer calls this function (relayer pays gas)
     * 4. User's tokens are staked without needing MATIC
     */
    function stakeViaRelayer(
        address user,
        uint256 nonce,
        bytes calldata signature
    ) external nonReentrant whenNotPaused {
        require(user != address(0), "Invalid user");
        require(nonce == nonces[user], "Invalid nonce");

        // Create message hash
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "STAKE",
                user,
                nonce,
                STAKE_AMOUNT,
                address(this),
                block.chainid
            )
        );

        // Verify signature
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address recoveredSigner = ECDSA.recover(ethSignedMessageHash, signature);
        require(recoveredSigner == user, "Invalid signature");

        // Increment nonce to prevent replay
        nonces[user]++;

        // Transfer tokens from user to contract
        chatToken.safeTransferFrom(user, address(this), STAKE_AMOUNT);

        emit StakedViaRelayer(user, STAKE_AMOUNT, msg.sender);
    }

    /**
     * @dev Get user's current nonce (for meta-transactions)
     */
    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    // =========================================================================
    // ADMIN FUNCTIONS
    // =========================================================================

    function getContractBalance() external view returns (uint256) {
        return chatToken.balanceOf(address(this));
    }

    function withdrawContractProfit() external onlyOwner nonReentrant {
        require(contractProfit > 0, "No profits to withdraw");
        
        uint256 amount = contractProfit;
        contractProfit = 0;

        chatToken.safeTransfer(msg.sender, amount);

        emit ProfitWithdrawn(msg.sender, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount <= chatToken.balanceOf(address(this)), "Insufficient balance");
        chatToken.safeTransfer(msg.sender, amount);
    }
}