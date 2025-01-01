import hre, { ethers } from "hardhat";

export const mineBlocks = async (blocksToMine: number) => {
  for (let i = 0; i < blocksToMine; i++) {
    await ethers.provider.send("evm_mine", []);
  }
};
