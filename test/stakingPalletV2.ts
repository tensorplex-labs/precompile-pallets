import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { valHotkey, valHotkey2, valHotkey3 } from "./helpers/constants";
export async function deployPrecompiledPallet() {
  const [owner, otherAccount] = await hre.ethers.getSigners();
  const MockStakingPrecompiledPalletV2 = await hre.ethers.getContractFactory(
    "MockStakingPrecompiledPalletV2"
  );
  const mockStakingPrecompiledPalletV2 =
    await MockStakingPrecompiledPalletV2.deploy();
  return { mockStakingPrecompiledPalletV2, owner, otherAccount };
}

export async function deploySubnetPrecompiledPallet() {
  const [owner, otherAccount] = await hre.ethers.getSigners();
  const SubnetPrecompiledPallet = await hre.ethers.getContractFactory(
    "MockSubnetPrecompiledPallet"
  );
  const subnetPrecompiledPallet = await SubnetPrecompiledPallet.deploy();
  return { subnetPrecompiledPallet, owner, otherAccount };
}

describe("Precompiled Pallets", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  describe("Test Precompiled Pallet", function () {
    it("Should be able to add stake", async function () {
      const [__, otherAccount, otherAccount2] = await hre.ethers.getSigners();
      const { mockStakingPrecompiledPalletV2, owner } =
        await deployPrecompiledPallet();

      const address = await owner.getAddress();
      const bytes32Hotkey = await mockStakingPrecompiledPalletV2.getBytes32(
        address
      );
      const bytesLikeHotkey = ethers.hexlify(bytes32Hotkey);
      const bytes32Hotkey2 = await mockStakingPrecompiledPalletV2.getBytes32(
        otherAccount.address
      );
      const bytesLikeHotkey2 = ethers.hexlify(bytes32Hotkey2);
      await mockStakingPrecompiledPalletV2.updateH160toSS58Address(
        await owner.getAddress(),
        bytes32Hotkey
      );
      await mockStakingPrecompiledPalletV2.updateH160toSS58Address(
        await otherAccount.getAddress(),
        bytes32Hotkey2
      );

      await mockStakingPrecompiledPalletV2.addStake(
        valHotkey,
        ethers.parseUnits("100", 9),
        1
      );
      await mockStakingPrecompiledPalletV2
        .connect(otherAccount)
        .addStake(valHotkey, 1, ethers.parseUnits("100", 9));

      // After adding the stake,
      const totalHotkeyAlpha =
        await mockStakingPrecompiledPalletV2.totalHotkeyAlpha(valHotkey, 1);
      const totalHotkeyShares =
        await mockStakingPrecompiledPalletV2.totalHotkeyShares(valHotkey, 1);
      const alpha = await mockStakingPrecompiledPalletV2.alpha(
        valHotkey,
        bytesLikeHotkey,
        1
      );
      const alpha2 = await mockStakingPrecompiledPalletV2.alpha(
        valHotkey,
        bytesLikeHotkey2,
        1
      );
      console.log("totalHotkeyAlpha", totalHotkeyAlpha);
      console.log("totalHotkeyShares", totalHotkeyShares);
      console.log("alpha", alpha);
      console.log("alpha2", alpha2);
      expect(alpha + alpha2).to.equal(totalHotkeyAlpha);
      expect(alpha + alpha2).to.equal(totalHotkeyShares);
      const stake = await mockStakingPrecompiledPalletV2.getStake(
        valHotkey,
        bytesLikeHotkey,
        1
      );
      expect(stake).to.equal(alpha);
    });
  });
});
