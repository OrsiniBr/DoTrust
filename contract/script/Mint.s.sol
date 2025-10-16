// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Mint} from "../src/Mint.sol";

contract MintScript is Script {
    Mint public mint;
    address public token = 0x18A4D5649bdD29E758C03aE70D0932f99321f91a;
    
    function run() public {
        vm.startBroadcast();

        mint = new Mint(token);

        vm.stopBroadcast();
    }
}
