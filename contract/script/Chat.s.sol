// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Chat} from "../src/Chat.sol";

contract ChatScript is Script {
    Chat public chat;
    address public chatToken = 0x45Bb03fEa28280f9fc35b334F9EcF41B8Cf6C3fa;

    function run() public {
        vm.startBroadcast();

        chat = new Chat(chatToken);

        vm.stopBroadcast();
    }
}
