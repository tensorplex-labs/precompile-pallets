// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./interfaces/IStakingPrecompiledPallet.sol";
// import "hardhat/console.sol";

contract MockStakingPrecompiledPallet {
    // Storage for share pool implementation
    mapping(bytes32 => mapping(uint256 => uint256)) public totalHotkeyAlpha; // hotkey => netuid => value
    mapping(bytes32 => mapping(bytes32 => mapping(uint256 => uint256))) public alpha; // hotkey => coldkey => netuid => shares
    mapping(bytes32 => mapping(uint256 => uint256)) public totalHotkeyShares; // hotkey => netuid => total_shares

    // Subnet pools remain the same
    mapping(uint256 => uint256) public subnetAlphas;
    mapping(uint256 => uint256) public subnetTAOs;
    uint256 public totalNetworks = 10;

    constructor() {
        for (uint256 i = 0; i < totalNetworks; i++) {
            subnetAlphas[i] = 1000000000000000000;
            subnetTAOs[i] = 1000000000000000000;
        }
    }

    receive() external payable {
        // This function allows the contract to receive ETH
    }

    // Helper functions remain the same
    function getBytes32(address addr) public pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }

    function addStake(bytes32 hotkey, uint256 netuid) external payable {
        uint256 taoAmount = msg.value;
        uint256 alphaAmount = calculateSwapOutput(netuid, taoAmount, true);
        bytes32 coldkey = getBytes32(msg.sender);

        // Get current values
        uint256 currentTotalAlpha = totalHotkeyAlpha[hotkey][netuid];
        uint256 currentShares = alpha[hotkey][coldkey][netuid];
        uint256 currentTotalShares = totalHotkeyShares[hotkey][netuid];

        // Update share pool values
        if (currentTotalShares == 0) {
            // First stake to this hotkey
            totalHotkeyAlpha[hotkey][netuid] = alphaAmount;
            alpha[hotkey][coldkey][netuid] = alphaAmount;
            totalHotkeyShares[hotkey][netuid] = alphaAmount;
        } else {
            // Calculate new shares
            uint256 valuePerShare = (currentTotalAlpha * 1e9) / currentTotalShares; // Use 1e18 for precision
            uint256 newShares = (alphaAmount * 1e9) / valuePerShare;

            // Update storage
            totalHotkeyAlpha[hotkey][netuid] += alphaAmount;
            alpha[hotkey][coldkey][netuid] += newShares;
            totalHotkeyShares[hotkey][netuid] += newShares;
        }

        // Update subnet pools
        subnetTAOs[netuid] += taoAmount;
        subnetAlphas[netuid] -= alphaAmount;
    }

    function removeStake(bytes32 hotkey, uint256 netuid, uint256 shareAmount) external {
        bytes32 coldkey = getBytes32(msg.sender);

        // Get current values
        uint256 currentTotalAlpha = totalHotkeyAlpha[hotkey][netuid];
        uint256 currentShares = alpha[hotkey][coldkey][netuid];
        uint256 currentTotalShares = totalHotkeyShares[hotkey][netuid];

        require(currentShares >= shareAmount, "Insufficient shares");

        // Calculate alpha amount to remove
        uint256 alphaAmount = (shareAmount * currentTotalAlpha) / currentTotalShares;
        uint256 taoAmount = calculateSwapOutput(netuid, alphaAmount, false);

        // Update share pool values
        totalHotkeyAlpha[hotkey][netuid] -= alphaAmount;
        alpha[hotkey][coldkey][netuid] -= shareAmount;
        totalHotkeyShares[hotkey][netuid] -= shareAmount;

        // Update subnet pools
        require(subnetAlphas[netuid] >= alphaAmount, "Insufficient alpha in subnet");
        subnetAlphas[netuid] += alphaAmount;
        require(subnetTAOs[netuid] >= taoAmount, "Insufficient TAO in subnet");
        subnetTAOs[netuid] -= taoAmount;

        // Transfer TAO back to user
        payable(msg.sender).transfer(taoAmount);
    }

    function getStake(bytes32 hotkey, bytes32 coldkey, uint256 netuid) external view returns (uint256) {
        uint256 shares = alpha[hotkey][coldkey][netuid];
        uint256 totalShares = totalHotkeyShares[hotkey][netuid];
        if (totalShares == 0) return 0;

        uint256 totalAlpha = totalHotkeyAlpha[hotkey][netuid];
        return (shares * totalAlpha) / totalShares;
    }

    function calculateSwapOutput(uint256 netuid, uint256 amountIn, bool isNativeToAlpha) public view returns (uint256) {
        uint256 reserveIn = isNativeToAlpha ? subnetTAOs[netuid] : subnetAlphas[netuid];
        uint256 reserveOut = isNativeToAlpha ? subnetAlphas[netuid] : subnetTAOs[netuid];
        uint256 numerator = amountIn * reserveOut;
        uint256 denominator = reserveIn + amountIn;
        return numerator / denominator;
    }
}
