# Precompile Pallets (Beta Version)

## Purpose

This repository contains the mock precompile pallets used to test and simulate smart contracts that interact with them using hardhat.

## Problem

Unit testing is required to be fast and easy to run. However, testing against the actual Substrate blockchain is slow and requires a lot of setup. Thus, we have created the precompile pallets to simulate the behavior of the Substrate blockchain in a fast and easy to use way.

## Drawback

The precompile pallets are not a perfect simulation of the Substrate blockchain. They are a simplified version that only support the functionality that we need for our testing.

Whenever there are updates to the precompile pallets, we need to update the mock contracts to match the new functionality.
