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

      await mockStakingPrecompiledPallet.addStake(valHotkey, 1, {
        value: 100,
      });
      const bytes32Hotkey = await mockStakingPrecompiledPallet.getBytes32(
        address
      );
      const bytesLikeHotkey = ethers.hexlify(bytes32Hotkey);
      const totalColdkeyAlpha =
        await mockStakingPrecompiledPallet.totalColdkeyAlpha(
          bytesLikeHotkey,
          1
        );
      expect(totalColdkeyAlpha).to.equal(99);
      const totalHotkeyAlpha =
        await mockStakingPrecompiledPallet.totalHotkeyAlpha(valHotkey, 1);
      expect(totalHotkeyAlpha).to.equal(99);

      await mockStakingPrecompiledPallet.removeStake(valHotkey, 1, 99);
      const totalColdkeyAlphaAfter =
        await mockStakingPrecompiledPallet.totalColdkeyAlpha(
          bytesLikeHotkey,
          1
        );
      expect(totalColdkeyAlphaAfter).to.equal(0);
      const totalHotkeyAlphaAfter =
        await mockStakingPrecompiledPallet.totalHotkeyAlpha(valHotkey, 1);
      expect(totalHotkeyAlphaAfter).to.equal(0);
    });
  });
  it("Should add multiple stake from two different addresses", async function () {
    const [signer, otherAccount] = await hre.ethers.getSigners();
    const { mockStakingPrecompiledPallet, owner } =
      await deployPrecompiledPallet();

    await mockStakingPrecompiledPallet.connect(signer).addStake(valHotkey, 1, {
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
      .addStake(valHotkey, 1, {
        value: 100,
      });
    const totalSignerColdkeyAlpha =
      await mockStakingPrecompiledPallet.totalColdkeyAlpha(
        signerBytesLikeHotkey,
        1
      );
    const totalOtherAccountColdkeyAlpha =
      await mockStakingPrecompiledPallet.totalColdkeyAlpha(
        otherAccountBytesLikeHotkey,
        1
      );
    const totalHotkeyAlpha =
      await mockStakingPrecompiledPallet.totalHotkeyAlpha(valHotkey, 1);
    expect(totalHotkeyAlpha).to.equal(198);
    expect(totalSignerColdkeyAlpha).to.equal(99);
    expect(totalOtherAccountColdkeyAlpha).to.equal(99);
    // Now we try to unstake from the signer address
    await mockStakingPrecompiledPallet
      .connect(signer)
      .removeStake(valHotkey, 1, 99);
    const totalHotkeyAlphaAfter =
      await mockStakingPrecompiledPallet.totalHotkeyAlpha(valHotkey, 1);
    expect(totalHotkeyAlphaAfter).to.equal(99);
  });
});
