//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Chat is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public chatToken;

    event Staked(address indexed user, uint256 tokenAmount);
    event Compensated(
        address indexed recipient, uint256 compensationAmount, uint256 contractFee
    );
    event Refunded(address indexed recipient, uint256 refundAmount);
    event ProfitWithdrawn(address indexed owner, uint256 amount);

    uint256 public constant stakeAmount = 3 * 1e18; // $3 worth of tokens
    uint256 public constant compensateAmount = 5 * 1e18; // $5 worth of tokens
    uint256 public constant contractFee = 1 * 1e18; // $1 worth of tokens
    uint256 public contractProfit;


    constructor(address _token) Ownable(msg.sender) {
        chatToken = IERC20(_token) ;
    }

    function stake() public nonReentrant whenNotPaused {
        chatToken.safeTransferFrom(msg.sender, address(this), stakeAmount);

        emit Staked(msg.sender, stakeAmount);
    }

    function compensate(address recipient) public onlyOwner nonReentrant {
     
        contractProfit += contractFee;

        chatToken.safeTransfer(recipient, compensateAmount);

        emit Compensated(recipient,compensateAmount, contractFee);
    }

    function refund(address recipient) public onlyOwner nonReentrant {
      
        // Refund to recipient
        chatToken.safeTransfer(recipient, stakeAmount);

        emit Refunded(recipient, stakeAmount);
    }

    function getContractBalance() public view returns (uint256) {
        return chatToken.balanceOf(address(this));
    }

    function withdrawContractProfit() public onlyOwner nonReentrant {
        require(contractProfit > 0, "No profits to withdraw");
        uint256 amount = contractProfit;
        contractProfit = 0;
        
        // Transfer FROM contract TO owner
        chatToken.safeTransfer(msg.sender, amount);
        
        emit ProfitWithdrawn(msg.sender, amount);
    }

    // Admin functions
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // Emergency withdrawal function
    function emergencyWithdraw(uint256 amount) public onlyOwner {
        require(amount <= chatToken.balanceOf(address(this)), "Insufficient balance");
        chatToken.safeTransfer(msg.sender, amount);
    }
}



// pragma solidity ^0.8.20;

// import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/utils/Pausable.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// contract Chat is ReentrancyGuard, Ownable, Pausable {
//     using SafeERC20 for IERC20;

//     IERC20 public immutable chatToken;

//     event Staked(address indexed user, uint256 tokenAmount);
//     event Compensated(address indexed recipient, uint256 compensationAmount, uint256 contractFee);
//     event Refunded(address indexed recipient, uint256 refundAmount);
//     event ProfitWithdrawn(address indexed owner, uint256 amount);

//     uint256 public constant STAKE_AMOUNT = 3 * 1e18; // $3 worth of tokens
//     uint256 public constant COMPENSATE_AMOUNT = 5 * 1e18; // $5 worth of tokens
//     uint256 public constant CONTRACT_FEE = 1 * 1e18; // $1 worth of tokens
    
//     uint256 public contractProfit;
//     mapping(bytes32 => bool) public usedSignatures;

//     constructor(address _chatToken) Ownable(msg.sender) {
//         require(_chatToken != address(0), "Invalid token address");
//         chatToken = IERC20(_chatToken);
//     }

//     /**
//      * @notice User stakes tokens to access chat
//      */
//     function stake() external nonReentrant whenNotPaused {
//         chatToken.safeTransferFrom(msg.sender, address(this), STAKE_AMOUNT);
//         emit Staked(msg.sender, STAKE_AMOUNT);
//     }

//     /**
//      * @notice Compensate a user who was harassed (owner signature required)
//      * @param recipient Address to receive compensation
//      * @param nonce Unique nonce for this compensation
//      * @param signature Owner's signature authorizing compensation
//      */
//     function compensate(
//         address recipient, 
//         uint256 nonce, 
//         bytes calldata signature
//     ) external nonReentrant {
//         require(recipient != address(0), "Invalid recipient");

//         // Create message hash
//         bytes32 messageHash = keccak256(
//             abi.encodePacked(
//                 recipient,
//                 nonce,
//                 COMPENSATE_AMOUNT,
//                 address(this),
//                 block.chainid
//             )
//         );

//         require(!usedSignatures[messageHash], "Signature already used");

//         // Verify signature is from owner
//         bytes32 ethSignedMessageHash = ECDSA.toEthSignedMessageHash(messageHash);
//         address recoveredSigner = ECDSA.recover(ethSignedMessageHash, signature);
//         require(recoveredSigner == owner(), "Invalid signature");

//         // Mark signature as used
//         usedSignatures[messageHash] = true;

//         // Add fee to profit
//         contractProfit += CONTRACT_FEE;

//         // Transfer compensation to recipient
//         chatToken.safeTransfer(recipient, COMPENSATE_AMOUNT);

//         emit Compensated(recipient, COMPENSATE_AMOUNT, CONTRACT_FEE);
//     }

//     /**
//      * @notice Refund a user's stake (owner signature required)
//      * @param recipient Address to receive refund
//      * @param nonce Unique nonce for this refund
//      * @param signature Owner's signature authorizing refund
//      */
//     function refund(
//         address recipient, 
//         uint256 nonce, 
//         bytes calldata signature
//     ) external nonReentrant {
//         require(recipient != address(0), "Invalid recipient");

//         // Create message hash
//         bytes32 messageHash = keccak256(
//             abi.encodePacked(
//                 recipient,
//                 nonce,
//                 STAKE_AMOUNT,
//                 address(this),
//                 block.chainid
//             )
//         );

//         require(!usedSignatures[messageHash], "Signature already used");

//         // Verify signature is from owner
//         bytes32 ethSignedMessageHash = ECDSA.toEthSignedMessageHash(messageHash);
//         address recoveredSigner = ECDSA.recover(ethSignedMessageHash, signature);
//         require(recoveredSigner == owner(), "Invalid signature");

//         // Mark signature as used
//         usedSignatures[messageHash] = true;

//         // Transfer refund to recipient
//         chatToken.safeTransfer(recipient, STAKE_AMOUNT);

//         emit Refunded(recipient, STAKE_AMOUNT);
//     }

//     /**
//      * @notice Get contract's token balance
//      */
//     function getContractBalance() external view returns (uint256) {
//         return chatToken.balanceOf(address(this));
//     }

//     /**
//      * @notice Owner withdraws accumulated profit
//      */
//     function withdrawContractProfit() external onlyOwner nonReentrant {
//         require(contractProfit > 0, "No profits to withdraw");
        
//         uint256 amount = contractProfit;
//         contractProfit = 0;

//         chatToken.safeTransfer(msg.sender, amount);

//         emit ProfitWithdrawn(msg.sender, amount);
//     }

//     /**
//      * @notice Pause contract (emergency only)
//      */
//     function pause() external onlyOwner {
//         _pause();
//     }

//     /**
//      * @notice Unpause contract
//      */
//     function unpause() external onlyOwner {
//         _unpause();
//     }

//     /**
//      * @notice Emergency withdrawal (owner only)
//      */
//     function emergencyWithdraw(uint256 amount) external onlyOwner {
//         require(amount <= chatToken.balanceOf(address(this)), "Insufficient balance");
//         chatToken.safeTransfer(msg.sender, amount);
//     }
// }