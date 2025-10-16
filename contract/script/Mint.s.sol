// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Mint} from "../src/Mint.sol";

contract MintScript is Script {
    Mint public mint;
    address public token = 0x45Bb03fEa28280f9fc35b334F9EcF41B8Cf6C3fa;
    
    function run() public {
        vm.startBroadcast();

        mint = new Mint(token);

        vm.stopBroadcast();
    }
}
