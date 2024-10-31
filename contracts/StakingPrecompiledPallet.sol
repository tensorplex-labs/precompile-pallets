// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./interfaces/IStakingPrecompiledPallet.sol";
// import "hardhat/console.sol";



contract MockStakingPrecompiledPallet {
    mapping(bytes32 => mapping(uint256 => uint256)) private stakes;
    mapping(uint256 => uint256) public subnetAlphas;
    mapping(uint256 => uint256) public subnetTAOs;
    mapping(bytes32 => mapping(uint256 => uint256)) private hotkeyAlphas;
    mapping(bytes32 => mapping(uint256 => uint256)) private coldkeyAlphas;
    uint256 public totalNetworks = 10;

    constructor() {
        for (uint256 i = 0; i < totalNetworks; i++) {
            subnetAlphas[i] = 1000000;
            subnetTAOs[i] = 1000000;
        }
    }

    // Add a receive() function to receive ETH
    receive() external payable {
        // This function allows the contract to receive ETH
    }

    function addUserStake(address user, bytes32 hotkey, uint256 netuid, uint256 amount) external {
        stakes[hotkey][netuid] += amount;
        hotkeyAlphas[bytes32(uint256(uint160(user)))][netuid] += amount;
        subnetAlphas[netuid] += amount;
        subnetTAOs[netuid] += amount;
    }

    function addLiquidityAlpha(uint256 amount, uint256 subnetId ) external {
        subnetAlphas[subnetId] += amount;
    }

    function addLiquidityBothSides(uint256 taoAmt, uint256 alphaAmt, uint256 subnetId) external {
        subnetTAOs[subnetId] += taoAmt;
        subnetAlphas[subnetId] += alphaAmt;
    }   

    function distributeGDT(address user, bytes32 valHotkey, uint256 amount) external {
        bytes32 userHotkey = getBytes32(user);
        for (uint256 i = 0; i < totalNetworks; i++) {
            hotkeyAlphas[valHotkey][i] += amount;
            coldkeyAlphas[userHotkey][i] += amount;
            stakes[valHotkey][i] += amount;
        }
    }

    function addStake(bytes32 hotkey, uint256 netuid) external payable  {
        uint256 nativeTokenAmount = msg.value;
        uint256 subnetAlphasOut = calculateSwapOutput(netuid, nativeTokenAmount, true);

        stakes[hotkey][netuid] += subnetAlphasOut;
        hotkeyAlphas[hotkey][netuid] += subnetAlphasOut;
        coldkeyAlphas[bytes32(uint256(uint160(msg.sender)))][netuid] += subnetAlphasOut;

        // Update subnet pools
        subnetTAOs[netuid] += nativeTokenAmount;
        subnetAlphas[netuid] -= subnetAlphasOut;
    }

    function getBytes32(address addr) public view returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }

    function removeStake(bytes32 hotkey, uint256 netuid, uint256 amount) external  {
        require(stakes[hotkey][netuid] >= amount, "Insufficient stake");

        uint256 nativeTokenOut = calculateSwapOutput(netuid, amount, false);
        stakes[hotkey][netuid] -= amount;
        hotkeyAlphas[hotkey][netuid] -= amount;
        coldkeyAlphas[bytes32(uint256(uint160(msg.sender)))][netuid] -= amount;

        // Update subnet pools
        require(subnetAlphas[netuid] >= amount, "Insufficient alpha");
        subnetAlphas[netuid] += amount;
        require(subnetTAOs[netuid] >= nativeTokenOut, "Insufficient TAO");
        subnetTAOs[netuid] -= nativeTokenOut;

        // Transfer native tokens back to the user
        payable(msg.sender).transfer(nativeTokenOut);

    }

    function moveStake(bytes32 src_hotkey, uint256 src_netuid, bytes32 dst_hotkey, uint256 dst_netuid, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(stakes[src_hotkey][src_netuid] >= amount, "Insufficient stake");
        stakes[src_hotkey][src_netuid] -= amount;
        hotkeyAlphas[src_hotkey][src_netuid] -= amount;
        coldkeyAlphas[getBytes32(msg.sender)][src_netuid] -= amount;
        stakes[dst_hotkey][dst_netuid] += amount;
        hotkeyAlphas[dst_hotkey][dst_netuid] += amount;
        coldkeyAlphas[getBytes32(msg.sender)][dst_netuid] += amount;
    }

    function subnetAlphaIn(uint256 netuid) external view returns (uint256) {
        return subnetAlphas[netuid];
    }

    function totalColdkeyAlpha(bytes32 coldkey, uint256 netuid) external view returns (uint256) {
        return coldkeyAlphas[coldkey][netuid];
    }

    function totalHotkeyAlpha(bytes32 hotkey, uint256 netuid) external view  returns (uint256) {
        return hotkeyAlphas[hotkey][netuid];
    }

    function setSubnetAlpha(uint256 netuid, uint256 alpha) external {
        subnetAlphas[netuid] = alpha;
    }

    function setSubnetTAO(uint256 netuid, uint256 tao) external {
        subnetTAOs[netuid] = tao;
    }

    // Helper function to calculate swap output based on constant product formula
    function calculateSwapOutput(uint256 netuid, uint256 amountIn, bool isNativeToAlpha) public view returns (uint256) {
        uint256 reserveIn = isNativeToAlpha ? subnetTAOs[netuid] : subnetAlphas[netuid];
        uint256 reserveOut = isNativeToAlpha ? subnetAlphas[netuid] : subnetTAOs[netuid];
        uint256 numerator = amountIn * reserveOut;
        uint256 denominator = reserveIn + amountIn;
        return numerator / denominator;
    }
}