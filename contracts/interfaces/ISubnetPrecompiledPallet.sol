// SPDX-License-Identifier: MIT
/*
 * This is the interface for the Subnet Precompiled Pallet
 * It is responsible to reigster subnet, register neuron into the subnet and get the total
 * number of networks
 *
 */
pragma solidity ^0.8.0;

interface ISubnetPrecompiledPallet {
    /**
     * @dev Registers a new network
     */
    function registerNetwork() external payable;

    /**
     * @param netuid The 16-bit network UID
     */
    function burnedRegister(uint256 netuid) external payable;

    /**
     * @dev Returns the total number of networks
     */
    function totalNetworks() external view returns (uint256);
}