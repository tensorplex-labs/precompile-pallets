// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./interfaces/IStakingPrecompiledPallet.sol";

contract MockStakingPrecompiledPallet {
    mapping(bytes32 => mapping(bytes32 => uint256)) private stakes;
    mapping(bytes32 => uint256) private hotkeyAlphas;
    mapping(bytes32 => uint256) private coldkeyAlphas;
    mapping(address => bytes32) private addressToSS58Mapping;
    uint256 public totalNetworks = 10;
    mapping(bytes32 => uint256) private lastStakeBlock;
    uint256 private constant STAKE_COOLDOWN_BLOCKS = 360;

    constructor() {}

    // Add a receive() function to receive ETH
    receive() external payable {
        // This function allows the contract to receive ETH
    }

    function setMapping(address user, bytes32 hotkey) external {
        addressToSS58Mapping[user] = hotkey;    
    }

    function addUserStake(bytes32 coldkey, bytes32 hotkey, uint256 netuid, uint256 amount) external payable {
        stakes[coldkey][hotkey] += amount;
        hotkeyAlphas[hotkey] += amount;
        coldkeyAlphas[coldkey] += amount;
    }

    // note that netuid is a noop until dtao launches
    function addStake(bytes32 hotkey, uint16 netuid) external payable  {
        bytes32 coldkey = addressToSS58Mapping[msg.sender];
        require(coldkey != bytes32(0), "No mapping found for address");
        require(
            block.number >= lastStakeBlock[coldkey] + STAKE_COOLDOWN_BLOCKS || lastStakeBlock[coldkey] == 0,
            "Must wait for cooldown period"
        );

        stakes[coldkey][hotkey] += msg.value;
        hotkeyAlphas[hotkey] += msg.value;
        coldkeyAlphas[coldkey] += msg.value;
        lastStakeBlock[coldkey] = block.number;
    }

    function removeStake(bytes32 hotkey, uint256 amount, uint16 netuid) external  {
        bytes32 coldkey = addressToSS58Mapping[msg.sender];
        require(coldkey != bytes32(0), "No mapping found for address");
        require(
            block.number >= lastStakeBlock[coldkey] + STAKE_COOLDOWN_BLOCKS || lastStakeBlock[coldkey] == 0,
            "Must wait for cooldown period"
        );
        require(stakes[coldkey][hotkey] >= amount, "Insufficient stake");
        require(hotkeyAlphas[hotkey] >= amount, "Insufficient hotkey alpha");   
        require(coldkeyAlphas[coldkey] >= amount, "Insufficient coldkey alpha");

        stakes[coldkey][hotkey] -= amount;
        hotkeyAlphas[hotkey] -= amount;
        coldkeyAlphas[coldkey] -= amount;
        lastStakeBlock[coldkey] = block.number;
        
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