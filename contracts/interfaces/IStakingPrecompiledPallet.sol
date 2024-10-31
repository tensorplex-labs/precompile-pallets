// SPDX-License-Identifier: MIT
/*
 * This is the interface for the Staking Pallet
 * It is responsible to delegate stake for a given hotkey and netuid
 * It is also responsible to get the subnet alpha and subnet TAO for a given netuid
 * It is also responsible to get the total hotkey alpha for a given hotkey and netuid
 */
pragma solidity ^0.8.0;

/// @title IStaking Interface
/// @notice Interface for the Staking Pallet, responsible for managing stake delegation and subnet parameters
interface IStakingPrecompiledPallet {
    /// @notice Adds stake for a given hotkey and subnet
    /// @param hotkey The hotkey to stake for
    /// @param netuid The subnet ID to stake in
    /// @dev This function is payable, the sent value is the amount to stake
    function addStake(bytes32 hotkey, uint256 netuid) external payable;

    /// @notice Removes stake for a given hotkey and subnet
    /// @param hotkey The hotkey to remove stake from
    /// @param netuid The subnet ID to remove stake from
    /// @param amount The amount of stake to remove
    function removeStake(bytes32 hotkey, uint256 netuid, uint256 amount) external;

    /// @notice Moves stake from one hotkey to another
    /// @param src_hotkey The hotkey to move stake from
    /// @param src_netuid The subnet ID to move stake from
    /// @param dst_hotkey The hotkey to move stake to
    /// @param dst_netuid The subnet ID to move stake to
    /// @param amount The amount of stake to move
    function moveStake(bytes32 src_hotkey, uint256 src_netuid, bytes32 dst_hotkey, uint256 dst_netuid, uint256 amount) external;

    /// @notice Gets the subnet alpha for a given subnet
    /// @param netuid The subnet ID to query
    /// @return The subnet alpha value
    function subnetAlphaIn(uint256 netuid) external returns (uint256);

    /// @notice Gets the subnet TAO for a given subnet
    /// @param netuid The subnet ID to query
    /// @return The subnet TAO value
    function subnetTAOs(uint256 netuid) external returns (uint256);

    function subnetAlphas(uint256 netuid) external returns (uint256);

    /// @notice Gets the total hotkey alpha for a given hotkey and subnet
    /// @param hotkey The hotkey to query
    /// @param netuid The subnet ID to query
    /// @return The total hotkey alpha value
    function totalHotkeyAlpha(bytes32 hotkey, uint256 netuid) external returns (uint256);

    /// @notice Gets the total number of networks
    /// @return The total number of networks
    function totalNetworks() external view returns (uint256);
}

