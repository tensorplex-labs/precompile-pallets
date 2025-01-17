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

    // Add this new mapping to track hotkeys per coldkey
    mapping(bytes32 => bytes32[]) public coldkeyHotkeys; // coldkey => array of hotkeys
    mapping(bytes32 => mapping(bytes32 => bool)) private isHotkeyRegistered; // coldkey => hotkey => exists
    mapping(address => bytes32) public h160toSS58Address; // evmAddress => coldkey

    constructor() {
        for (uint256 i = 0; i < totalNetworks; i++) {
            subnetAlphas[i] = 1000000000000000000;
            subnetTAOs[i] = 1000000000000000000;
        }
    }

    receive() external payable {
        // This function allows the contract to receive ETH
    }

    function updateH160toSS58Address(address h160, bytes32 ss58) external {
        h160toSS58Address[h160] = ss58;
    }

    function stakingHotkeys(bytes32 hotkey) external view returns (bytes32[] memory) {
        return coldkeyHotkeys[hotkey];
    }

    // Helper functions remain the same
    function getBytes32(address addr) public pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }

    function addStake(bytes32 hotkey, uint256 netuid) external payable {
        uint256 taoAmount = msg.value;
        uint256 alphaAmount = calculateSwapOutput(netuid, taoAmount, true);
        bytes32 coldkey = h160toSS58Address[msg.sender];

        // Add hotkey to coldkey's list if not already registered
        if (!isHotkeyRegistered[coldkey][hotkey]) {
            coldkeyHotkeys[coldkey].push(hotkey);
            isHotkeyRegistered[coldkey][hotkey] = true;
        }

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
        bytes32 coldkey = h160toSS58Address[msg.sender];

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

        // If this was the last stake (no more shares), remove the hotkey from coldkey's list
        if (alpha[hotkey][coldkey][netuid] == 0) {
            // Check if this was the last netuid with stakes
            bool hasOtherStakes = false;
            for (uint256 i = 0; i < totalNetworks; i++) {
                if (i != netuid && alpha[hotkey][coldkey][i] > 0) {
                    hasOtherStakes = true;
                    break;
                }
            }

            if (!hasOtherStakes) {
                removeHotkeyFromColdkey(coldkey, hotkey);
            }
        }
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

    // Add this helper function
    function removeHotkeyFromColdkey(bytes32 coldkey, bytes32 hotkey) private {
        bytes32[] storage hotkeys = coldkeyHotkeys[coldkey];
        for (uint256 i = 0; i < hotkeys.length; i++) {
            if (hotkeys[i] == hotkey) {
                // Swap with last element and pop
                hotkeys[i] = hotkeys[hotkeys.length - 1];
                hotkeys.pop();
                isHotkeyRegistered[coldkey][hotkey] = false;
                break;
            }
        }
    }

    // Add this view function to get all hotkeys for a coldkey
    function getHotkeysForColdkey(bytes32 coldkey) external view returns (bytes32[] memory) {
        return coldkeyHotkeys[coldkey];
    }
}
