// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./interfaces/IStakingPrecompiledPallet.sol";
// import "hardhat/console.sol";



contract MockStakingPrecompiledPallet {
    mapping(bytes32 => mapping(bytes32 => uint256)) private stakes;
    mapping(bytes32 => uint256) private hotkeyAlphas;
    mapping(bytes32 => uint256) private coldkeyAlphas;
    uint256 public totalNetworks = 10;

    constructor() {}

    // Add a receive() function to receive ETH
    receive() external payable {
        // This function allows the contract to receive ETH
    }

    function addUserStake(address user, bytes32 hotkey, uint256 netuid, uint256 amount) external payable {
        bytes32 coldkey = getBytes32(user);
        stakes[coldkey][hotkey] += amount;
        hotkeyAlphas[hotkey] += amount;
        coldkeyAlphas[coldkey] += amount;
    }

    // note that netuid is a noop until dtao launches
    function addStake(bytes32 hotkey, uint16 netuid) external payable  {
        bytes32 coldkey = getBytes32(msg.sender);
        stakes[coldkey][hotkey] += msg.value;
        hotkeyAlphas[hotkey] += msg.value;
        coldkeyAlphas[coldkey] += msg.value;
    }

    function getBytes32(address addr) public view returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }

    // note that netuid is a noop until dtao launches
    function removeStake(bytes32 hotkey, uint256 amount, uint16 netuid) external  {
        bytes32 coldkey = getBytes32(msg.sender);
        require(stakes[coldkey][hotkey] >= amount, "Insufficient stake");
        require(hotkeyAlphas[hotkey] >= amount, "Insufficient hotkey alpha");   
        require(coldkeyAlphas[coldkey] >= amount, "Insufficient coldkey alpha");


        stakes[coldkey][hotkey] -= amount;
        hotkeyAlphas[hotkey] -= amount;
        coldkeyAlphas[bytes32(uint256(uint160(msg.sender)))] -= amount;
        // Transfer native tokens back to the user
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
    }

    function getStake(bytes32 coldkey, bytes32 hotkey, uint16 netuid) external view returns (uint256) {
        return stakes[coldkey][hotkey];
    }


    function totalColdkeyAlpha(bytes32 coldkey) external view returns (uint256) {
        return coldkeyAlphas[coldkey];
    }

    function totalHotkeyAlpha(bytes32 hotkey) external view  returns (uint256) {
        return hotkeyAlphas[hotkey];
    }

}