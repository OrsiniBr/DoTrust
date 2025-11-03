// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Token} from "../src/Token.sol";

contract TokenScript is Script {
    Token public token;
    uint256 public initialSupply = 1000000000000000000000;
    address public treasury = 0x379beF16d52ec8B2B033497287Ec911A777A1917;

    function run() public {
        vm.startBroadcast();

        token = new Token(initialSupply, treasury);

        vm.stopBroadcast();
    }
}
