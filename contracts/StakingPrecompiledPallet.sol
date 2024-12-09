// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./interfaces/IStakingPrecompiledPallet.sol";
// import "hardhat/console.sol";



contract MockStakingPrecompiledPallet {
    mapping(bytes32 => uint256) private stakes;
    mapping(bytes32 => uint256) private hotkeyAlphas;
    mapping(bytes32 => uint256) private coldkeyAlphas;
    uint256 public totalNetworks = 10;

    constructor() {}

    // Add a receive() function to receive ETH
    receive() external payable {
        // This function allows the contract to receive ETH
    }

    function addUserStake(address user, bytes32 hotkey, uint256 netuid, uint256 amount) external payable {
        stakes[hotkey] += amount;
        hotkeyAlphas[hotkey] += amount;
        coldkeyAlphas[bytes32(uint256(uint160(user)))] += amount;
    }

    function addStake(bytes32 hotkey) external payable  {
        stakes[hotkey] += msg.value;
        hotkeyAlphas[hotkey] += msg.value;
        coldkeyAlphas[bytes32(uint256(uint160(msg.sender)))] += msg.value;
    }

    function getBytes32(address addr) public view returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }

    function removeStake(bytes32 hotkey, uint256 amount) external  {
        require(stakes[hotkey] >= amount, "Insufficient stake");
        require(hotkeyAlphas[hotkey] >= amount, "Insufficient hotkey alpha");   
        require(coldkeyAlphas[bytes32(uint256(uint160(msg.sender)))] >= amount, "Insufficient coldkey alpha");


        stakes[hotkey] -= amount;
        hotkeyAlphas[hotkey] -= amount;
        coldkeyAlphas[bytes32(uint256(uint160(msg.sender)))] -= amount;
        // Transfer native tokens back to the user
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
    }


    function totalColdkeyAlpha(bytes32 coldkey) external view returns (uint256) {
        return coldkeyAlphas[coldkey];
    }

    function totalHotkeyAlpha(bytes32 hotkey) external view  returns (uint256) {
        return hotkeyAlphas[hotkey];
    }

}