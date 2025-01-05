# Precompile Pallets (Beta Version)

## Purpose

This repository contains the mock precompile pallets used to test and simulate smart contracts that interact with them using hardhat.

## Problem

Unit testing is required to be fast and easy to run. However, testing against the actual Substrate blockchain is slow and requires a lot of setup. Thus, we have created the precompile pallets to simulate the behavior of the Substrate blockchain in a fast and easy to use way.

## Drawback

The precompile pallets are not a perfect simulation of the Substrate blockchain. They are a simplified version that only support the functionality that we need for our testing.

Whenever there are updates to the precompile pallets, we need to update the mock contracts to match the new functionality.

## StakingPrecompilePallet.sol

Contract Address for actual precompiled pallet (0x0000000000000000000000000000000000000801)

Following mocks have been implemented:

- `addStake(bytes32 hotkey, uint16 netuid) payable`
- `removeStake(bytes32 hotkey, uint256 amount, uint16 netuid)`
- `getStake(bytes32 coldkey, bytes32 hotkey, uint16 netuid) external view returns (uint256)` (Note that this method is currently in the PR by OTF so it is not yet available in the testnet/mainnet)

Notes:

- rateLimit of 720 blocks implemented similar to substrate logic. This will help to simulate cases where you stake and unstake too quickly.

## SubnetsPrecompilePallet.sol

Contract Address for actual precompiled pallet (0x0000000000000000000000000000000000000804)

Note: This pallet is not yet available in the testnet/mainnet.

Following mocks have been implemented:

- `burnedRegister(uint16 netuid, bytes32 hotkey) public payable` (Note that this method is currently in the PR by OTF so it is not yet available in the testnet/mainnet)
