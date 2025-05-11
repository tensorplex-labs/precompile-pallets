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
      const bytes32Hotkey = await mockStakingPrecompiledPallet.getBytes32(
        address
      );
      const bytesLikeHotkey = ethers.hexlify(bytes32Hotkey);
      const bytes32Hotkey2 = await mockStakingPrecompiledPallet.getBytes32(
        otherAccount.address
      );
      const bytesLikeHotkey2 = ethers.hexlify(bytes32Hotkey2);
      await mockStakingPrecompiledPallet.updateH160toSS58Address(
        await owner.getAddress(),
        bytes32Hotkey
      );
      await mockStakingPrecompiledPallet.updateH160toSS58Address(
        await otherAccount.getAddress(),
        bytes32Hotkey2
      );

      await mockStakingPrecompiledPallet.addStake(valHotkey, 1, {
        value: ethers.parseUnits("100", 9),
      });
      await mockStakingPrecompiledPallet
        .connect(otherAccount)
        .addStake(valHotkey, 1, {
          value: ethers.parseUnits("100", 9),
        });

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
    it("stake unstake for 1 hotkey", async function () {
      const [__, otherAccount, otherAccount2] = await hre.ethers.getSigners();
      const { mockStakingPrecompiledPallet, owner } =
        await deployPrecompiledPallet();
      const address = await owner.getAddress();
      const bytes32Hotkey = await mockStakingPrecompiledPallet.getBytes32(
        address
      );
      const bytes32Hotkey2 = await mockStakingPrecompiledPallet.getBytes32(
        otherAccount.address
      );
      await mockStakingPrecompiledPallet.updateH160toSS58Address(
        await owner.getAddress(),
        bytes32Hotkey
      );
      await mockStakingPrecompiledPallet.updateH160toSS58Address(
        await otherAccount.getAddress(),
        bytes32Hotkey2
      );
      await mockStakingPrecompiledPallet.updateH160toSS58Address(
        await otherAccount.getAddress(),
        valHotkey2
      );
      const stakedNativeAmt = ethers.parseUnits("5", 9);
      const beforeStakingOwnerBalance = await owner.provider.getBalance(
        owner.address
      );
      await mockStakingPrecompiledPallet.addStake(valHotkey, 1, {
        value: stakedNativeAmt,
      });
      const mockBalance = await owner.provider.getBalance(
        mockStakingPrecompiledPallet.getAddress()
      );
      expect(mockBalance).to.equal(stakedNativeAmt);
      const afterStakingOwnerBalance = await owner.provider.getBalance(
        owner.address
      );
      expect(afterStakingOwnerBalance).to.equal(
        beforeStakingOwnerBalance - stakedNativeAmt
      );

      // After adding the stake, we need to get the total stake by calculating the total alpha and shares for each hotkey
      const stakingHotkeys = await mockStakingPrecompiledPallet.stakingHotkeys(
        bytes32Hotkey
      );
      expect(stakingHotkeys.length).to.equal(1);
      const totalHotkeyAlpha =
        await mockStakingPrecompiledPallet.totalHotkeyAlpha(valHotkey, 1);
      const totalHotkeyShares =
        await mockStakingPrecompiledPallet.totalHotkeyShares(valHotkey, 1);
      const bytesLikeHotkey = ethers.hexlify(bytes32Hotkey);
      const alpha = await mockStakingPrecompiledPallet.alpha(
        valHotkey,
        bytesLikeHotkey,
        1
      );
      console.log("totalHotkeyAlpha", totalHotkeyAlpha);
      console.log("totalHotkeyShares", totalHotkeyShares);
      console.log("alpha", alpha);
      const absoluteAlpha = (alpha * totalHotkeyShares) / totalHotkeyAlpha;
      const currentBalance = await owner.provider.getBalance(owner.address);
      await mockStakingPrecompiledPallet.removeStake(
        valHotkey,
        1,
        absoluteAlpha
      );
      const mockBalanceAfterInPallet = await owner.provider.getBalance(
        mockStakingPrecompiledPallet.getAddress()
      );
      expect(mockBalanceAfterInPallet).to.be.within(0, 1);

      expect(
        await mockStakingPrecompiledPallet.totalHotkeyAlpha(valHotkey, 1)
      ).to.equal(0);
      expect(
        await mockStakingPrecompiledPallet.totalHotkeyShares(valHotkey, 1)
      ).to.equal(0);
      expect(
        await mockStakingPrecompiledPallet.alpha(valHotkey, bytesLikeHotkey, 1)
      ).to.equal(0);
      const newBalance = await owner.provider.getBalance(owner.address);
      expect(newBalance).to.be.within(
        currentBalance + stakedNativeAmt - BigInt(1),
        currentBalance + stakedNativeAmt
      );
    });
    it("Calculate total stake across 3 hotkeys", async function () {
      const [__, otherAccount, otherAccount2] = await hre.ethers.getSigners();
      const { mockStakingPrecompiledPallet, owner } =
        await deployPrecompiledPallet();
      const address = await owner.getAddress();
      const bytes32Hotkey = await mockStakingPrecompiledPallet.getBytes32(
        address
      );
      const bytes32Hotkey2 = await mockStakingPrecompiledPallet.getBytes32(
        otherAccount.address
      );
      await mockStakingPrecompiledPallet.updateH160toSS58Address(
        await owner.getAddress(),
        bytes32Hotkey
      );
      await mockStakingPrecompiledPallet.updateH160toSS58Address(
        await otherAccount.getAddress(),
        bytes32Hotkey2
      );
      await mockStakingPrecompiledPallet.updateH160toSS58Address(
        await otherAccount.getAddress(),
        valHotkey2
      );
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
      const stakingHotkeys = await mockStakingPrecompiledPallet.stakingHotkeys(
        bytes32Hotkey
      );
      expect(stakingHotkeys.length).to.equal(3);
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
  describe("Transfer Hotkey Stake", function () {
    it("Should be able to transfer hotkey stake", async function () {
      const [__, otherAccount, otherAccount2] = await hre.ethers.getSigners();
      const { mockStakingPrecompiledPallet, owner } =
        await deployPrecompiledPallet();
      const address = await owner.getAddress();
      const bytes32Hotkey = await mockStakingPrecompiledPallet.getBytes32(
        address
      );
      const bytes32Hotkey2 = await mockStakingPrecompiledPallet.getBytes32(
        otherAccount.address
      );

      await mockStakingPrecompiledPallet.updateH160toSS58Address(
        await owner.getAddress(),
        bytes32Hotkey
      );
      await mockStakingPrecompiledPallet.updateH160toSS58Address(
        await otherAccount.getAddress(),
        bytes32Hotkey2
      );
      await mockStakingPrecompiledPallet.addStake(valHotkey, 1, {
        value: ethers.parseUnits("100", 9),
      });
      await mockStakingPrecompiledPallet.transferHotkeyStake(
        valHotkey,
        valHotkey2,
        1,
        ethers.parseUnits("50", 9)
      );
      const bytesLikeHotkey = ethers.hexlify(bytes32Hotkey);
      const totalHotkeyAlpha2 =
        await mockStakingPrecompiledPallet.totalHotkeyAlpha(valHotkey2, 1);
      const totalHotkeyShares2 =
        await mockStakingPrecompiledPallet.totalHotkeyShares(valHotkey2, 1);
      const alphaShare = await mockStakingPrecompiledPallet.alpha(
        valHotkey2,
        bytesLikeHotkey,
        1
      );
      const alpha = (alphaShare * totalHotkeyShares2) / totalHotkeyAlpha2;
      expect(alpha).to.equal(ethers.parseUnits("50", 9));
    });
  });
  describe("Transfer Coldkey Stake", function () {
    it("Should be able to transfer coldkey stake", async function () {
      const [__, otherAccount, otherAccount2] = await hre.ethers.getSigners();
      const { mockStakingPrecompiledPallet, owner } =
        await deployPrecompiledPallet();

      // Set up initial state
      const ownerAddress = await owner.getAddress();
      const otherAccountAddress = await otherAccount.getAddress();
      const bytes32Coldkey1 = await mockStakingPrecompiledPallet.getBytes32(
        ownerAddress
      );
      const bytes32Coldkey2 = await mockStakingPrecompiledPallet.getBytes32(
        otherAccountAddress
      );

      await mockStakingPrecompiledPallet.updateH160toSS58Address(
        ownerAddress,
        bytes32Coldkey1
      );
      await mockStakingPrecompiledPallet.updateH160toSS58Address(
        otherAccountAddress,
        bytes32Coldkey2
      );

      // Add initial stake for coldkey1
      await mockStakingPrecompiledPallet.addStake(valHotkey, 1, {
        value: ethers.parseUnits("100", 9),
      });

      // Perform the transfer from coldkey1 to coldkey2
      await mockStakingPrecompiledPallet.transferStake(
        bytes32Coldkey1,
        bytes32Coldkey2,
        valHotkey,
        1,
        ethers.parseUnits("50", 9)
      );

      // Verify the results
      const totalHotkeyAlpha1 =
        await mockStakingPrecompiledPallet.totalHotkeyAlpha(valHotkey, 1);
      const totalHotkeyShares1 =
        await mockStakingPrecompiledPallet.totalHotkeyShares(valHotkey, 1);

      const totalHotkeyAlpha2 =
        await mockStakingPrecompiledPallet.totalHotkeyAlpha(valHotkey, 1);
      const totalHotkeyShares2 =
        await mockStakingPrecompiledPallet.totalHotkeyShares(valHotkey, 1);

      const alphaShare1 = await mockStakingPrecompiledPallet.alpha(
        valHotkey,
        bytes32Coldkey1,
        1
      );
      const alphaShare2 = await mockStakingPrecompiledPallet.alpha(
        valHotkey,
        bytes32Coldkey2,
        1
      );

      const alpha1 = (alphaShare1 * totalHotkeyShares1) / totalHotkeyAlpha1;
      const alpha2 = (alphaShare2 * totalHotkeyShares2) / totalHotkeyAlpha2;
      console.log("alpha1", alpha1);
      console.log("alpha2", alpha2);

      expect(alpha1).to.equal(ethers.parseUnits("49.99999", 9));
      expect(alpha2).to.equal(ethers.parseUnits("50", 9));
    });
  });
});
