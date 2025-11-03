// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Mint {
    IERC20 public token;
    uint256 public claimAmount = 15 * 10 ** 18; // 15 tokens (assuming 18 decimals)

    address public owner;

    event TokensClaimed(address indexed claimer, uint256 amount);

    constructor(address _tokenAddress) {
        token = IERC20(_tokenAddress);
        owner = msg.sender;
    }

    /**
     * @notice Claim 15 tokens - only works if user has 0 token balance
     */
    function claim() external {
        // Check if user already has tokens
        require(token.balanceOf(msg.sender) == 0, "You already have tokens");

        // Transfer tokens to claimer
        require(token.transfer(msg.sender, claimAmount), "Token transfer failed");

        emit TokensClaimed(msg.sender, claimAmount);
    }

    /**
     * @notice Check if an address can claim tokens
     */
    function canClaim(address user) external view returns (bool) {
        return token.balanceOf(user) == 0;
    }

    /**
     * @notice Owner can withdraw remaining tokens
     */
    function withdrawTokens(uint256 amount) external {
        require(msg.sender == owner, "Only owner");
        require(token.transfer(owner, amount), "Transfer failed");
    }

    /**
     * @notice Update claim amount (owner only)
     */
    function setClaimAmount(uint256 newAmount) external {
        require(msg.sender == owner, "Only owner");
        claimAmount = newAmount;
    }

    /**
     * @notice Get faucet token balance
     */
    function getFaucetBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}
