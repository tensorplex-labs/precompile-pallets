import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { valHotkey, valHotkey2, valHotkey3 } from "./helpers/constants";
export async function deployPrecompiledPallet() {
  const [owner, otherAccount] = await hre.ethers.getSigners();
  const MockStakingPrecompiledPallet = await hre.ethers.getContractFactory(
    "MockStakingPrecompiledPallet"
  );
  const mockStakingPrecompiledPallet =
    await MockStakingPrecompiledPallet.deploy();
  return { mockStakingPrecompiledPallet, owner, otherAccount };
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
      const { mockStakingPrecompiledPallet, owner } =
        await deployPrecompiledPallet();

      const address = await owner.getAddress();

      await mockStakingPrecompiledPallet.addStake(valHotkey, 1, {
        value: ethers.parseUnits("100", 9),
      });
      await mockStakingPrecompiledPallet
        .connect(otherAccount)
        .addStake(valHotkey, 1, {
          value: ethers.parseUnits("100", 9),
        });
      const bytes32Hotkey = await mockStakingPrecompiledPallet.getBytes32(
        address
      );
      const bytesLikeHotkey = ethers.hexlify(bytes32Hotkey);
      const bytes32Hotkey2 = await mockStakingPrecompiledPallet.getBytes32(
        otherAccount.address
      );
      const bytesLikeHotkey2 = ethers.hexlify(bytes32Hotkey2);
      // After adding the stake,
      const totalHotkeyAlpha =
        await mockStakingPrecompiledPallet.totalHotkeyAlpha(valHotkey, 1);
      const totalHotkeyShares =
        await mockStakingPrecompiledPallet.totalHotkeyShares(valHotkey, 1);
      const alpha = await mockStakingPrecompiledPallet.alpha(
        valHotkey,
        bytesLikeHotkey,
        1
      );
      const alpha2 = await mockStakingPrecompiledPallet.alpha(
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
    });
    it("Calculate total stake across 3 hotkeys", async function () {
      const [__, otherAccount, otherAccount2] = await hre.ethers.getSigners();
      const { mockStakingPrecompiledPallet, owner } =
        await deployPrecompiledPallet();
      await mockStakingPrecompiledPallet.addStake(valHotkey, 1, {
        value: ethers.parseUnits("1", 9),
      });
      await mockStakingPrecompiledPallet.addStake(valHotkey2, 1, {
        value: ethers.parseUnits("10", 9),
      });
      await mockStakingPrecompiledPallet.addStake(valHotkey3, 1, {
        value: ethers.parseUnits("50", 9),
      });
      // After adding the stake, we need to get the total stake by calculating the total alpha and shares for each hotkey
      const byteKeys = [valHotkey, valHotkey2, valHotkey3];
      let cumAmt = 0;
      for (const hotkey of byteKeys) {
        const totalHotkeyAlpha =
          await mockStakingPrecompiledPallet.totalHotkeyAlpha(hotkey, 1);
        const totalHotkeyShares =
          await mockStakingPrecompiledPallet.totalHotkeyShares(hotkey, 1);
        const bytes32Hotkey = await mockStakingPrecompiledPallet.getBytes32(
          owner.address
        );
        const bytesLikeHotkey = ethers.hexlify(bytes32Hotkey);
        const alpha = await mockStakingPrecompiledPallet.alpha(
          hotkey,
          bytesLikeHotkey,
          1
        );
        console.log("totalHotkeyAlpha", totalHotkeyAlpha);
        console.log("totalHotkeyShares", totalHotkeyShares);
        console.log("alpha", alpha);
        const absoluteAlpha = (alpha * totalHotkeyShares) / totalHotkeyAlpha;
        cumAmt += Number(absoluteAlpha);
      }
      const expectedAmount =
        ethers.parseUnits("1", 9) +
        ethers.parseUnits("10", 9) +
        ethers.parseUnits("50", 9);
      const tolerance = Number(expectedAmount) * 0.0000001; // 0.000001%
      expect(cumAmt).to.be.closeTo(Number(expectedAmount), tolerance);
    });
  });
});
