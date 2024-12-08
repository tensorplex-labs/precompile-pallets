import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { valHotkey } from "./helpers/constants";
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
      const { mockStakingPrecompiledPallet, owner } =
        await deployPrecompiledPallet();

      const address = await owner.getAddress();

      await mockStakingPrecompiledPallet.addStake(valHotkey, {
        value: 100,
      });
      const bytes32Hotkey = await mockStakingPrecompiledPallet.getBytes32(
        address
      );
      const bytesLikeHotkey = ethers.hexlify(bytes32Hotkey);
      const totalColdkeyAlpha =
        await mockStakingPrecompiledPallet.totalColdkeyAlpha(bytesLikeHotkey);
      expect(totalColdkeyAlpha).to.equal(100);
      const totalHotkeyAlpha =
        await mockStakingPrecompiledPallet.totalHotkeyAlpha(valHotkey);
      expect(totalHotkeyAlpha).to.equal(100);

      await mockStakingPrecompiledPallet.removeStake(valHotkey, 100);
      const totalColdkeyAlphaAfter =
        await mockStakingPrecompiledPallet.totalColdkeyAlpha(bytesLikeHotkey);
      expect(totalColdkeyAlphaAfter).to.equal(0);
      const totalHotkeyAlphaAfter =
        await mockStakingPrecompiledPallet.totalHotkeyAlpha(valHotkey);
      expect(totalHotkeyAlphaAfter).to.equal(0);
    });
  });
  it("Test Add User Stake", async function () {
    const { mockStakingPrecompiledPallet, owner } =
      await deployPrecompiledPallet();
    const address = await owner.getAddress();

    await mockStakingPrecompiledPallet.addUserStake(
      address,
      valHotkey,
      1,
      100,
      {
        value: 100,
      }
    );
    const bytes32Hotkey = await mockStakingPrecompiledPallet.getBytes32(
      address
    );
    const bytesLikeHotkey = ethers.hexlify(bytes32Hotkey);
    const totalColdkeyAlpha =
      await mockStakingPrecompiledPallet.totalColdkeyAlpha(bytesLikeHotkey);
    expect(totalColdkeyAlpha).to.equal(100);
    const totalHotkeyAlpha =
      await mockStakingPrecompiledPallet.totalHotkeyAlpha(valHotkey);
    expect(totalHotkeyAlpha).to.equal(100);

    await mockStakingPrecompiledPallet.removeStake(valHotkey, 100);
    const totalColdkeyAlphaAfter =
      await mockStakingPrecompiledPallet.totalColdkeyAlpha(bytesLikeHotkey);
    expect(totalColdkeyAlphaAfter).to.equal(0);
    const totalHotkeyAlphaAfter =
      await mockStakingPrecompiledPallet.totalHotkeyAlpha(valHotkey);
    expect(totalHotkeyAlphaAfter).to.equal(0);
  });
  it("Should add multiple stake from two different addresses", async function () {
    const [signer, otherAccount] = await hre.ethers.getSigners();
    const { mockStakingPrecompiledPallet, owner } =
      await deployPrecompiledPallet();

    await mockStakingPrecompiledPallet.connect(signer).addStake(valHotkey, {
      value: 100,
    });
    const signerBytes32Hotkey = await mockStakingPrecompiledPallet.getBytes32(
      signer.address
    );
    const signerBytesLikeHotkey = ethers.hexlify(signerBytes32Hotkey);
    const otherAccountBytes32Hotkey =
      await mockStakingPrecompiledPallet.getBytes32(otherAccount.address);
    const otherAccountBytesLikeHotkey = ethers.hexlify(
      otherAccountBytes32Hotkey
    );
    await mockStakingPrecompiledPallet
      .connect(otherAccount)
      .addStake(valHotkey, {
        value: 100,
      });
    const totalSignerColdkeyAlpha =
      await mockStakingPrecompiledPallet.totalColdkeyAlpha(
        signerBytesLikeHotkey
      );
    const totalOtherAccountColdkeyAlpha =
      await mockStakingPrecompiledPallet.totalColdkeyAlpha(
        otherAccountBytesLikeHotkey
      );
    const totalHotkeyAlpha =
      await mockStakingPrecompiledPallet.totalHotkeyAlpha(valHotkey);
    expect(totalHotkeyAlpha).to.equal(200);
    expect(totalSignerColdkeyAlpha).to.equal(100);
    expect(totalOtherAccountColdkeyAlpha).to.equal(100);
    // Now we try to unstake from the signer address
    await mockStakingPrecompiledPallet
      .connect(signer)
      .removeStake(valHotkey, 100);
    const totalHotkeyAlphaAfter =
      await mockStakingPrecompiledPallet.totalHotkeyAlpha(valHotkey);
    expect(totalHotkeyAlphaAfter).to.equal(100);
  });
});
