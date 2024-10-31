// SPDX-License-Identifier: GPL-3.0
// 
// This example demonstrates calling of ISubtensorBalanceTransfer precompile 
// from another smart contract

pragma solidity 0.8.20;

address constant ISUBTENSOR_STAKING_ADDRESS = 0x0000000000000000000000000000000000000802;

contract MockSubnetPrecompiledPallet {
    // Mapping to store registered users for each netuid
    mapping(uint256 => address[]) public registeredUsers;

    event SubnetPrecompiledPalletBurnedRegister(address user, uint256 netuid);
    uint256 currentTempo = 7200;

    function setTempo(uint256 _tempo) public {
        currentTempo = _tempo;
    }

    function tempo() public view returns (uint256) {
        return currentTempo;
    }

    function burnedRegister(uint256 netuid) public payable {
        // Add the sender's address to the list of registered users for this netuid
        registeredUsers[netuid].push(msg.sender);
        
        emit SubnetPrecompiledPalletBurnedRegister(msg.sender, netuid);
    }

    // Function to get the list of registered users for a specific netuid
    function getRegisteredUsers(uint256 netuid) public view returns (address[] memory) {
        return registeredUsers[netuid];
    }

    fallback() external payable {
        // This function is called when ETH is sent with data, or when no other function matches
    }
    receive() external payable {
        // This function is called when ETH is sent to the contract without data
    }
}