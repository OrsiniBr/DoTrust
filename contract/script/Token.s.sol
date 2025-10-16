// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Token} from "../src/Token.sol";

contract TokenScript is Script {
    Token public token;
    uint256 public initialSupply = 1000000000000000000000;
    address public treasury = 0x1b1823580654b007575923b751984901F57c4c7C;
   
    function run() public {
        vm.startBroadcast();

        token = new Token(initialSupply,treasury);

        vm.stopBroadcast();
    }
}
