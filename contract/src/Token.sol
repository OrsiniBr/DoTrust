// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract Token is ERC20 {
   
    constructor(uint256 initialSupply, address treasury) ERC20("DOTRUST Token", "DTT") {
        _mint(treasury, initialSupply);
    }
}