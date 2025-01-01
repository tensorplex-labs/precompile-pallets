import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { valHotkey } from "./helpers/constants";
import { convertH160ToSS58, ss58ToBytes } from "./helpers/addressMapping";
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
    "MockSubnetsPrecompiledPallet"
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

      const ss58Address = ss58ToBytes(convertH160ToSS58(address));

      await mockStakingPrecompiledPallet.setMapping(address, ss58Address);

      await mockStakingPrecompiledPallet.addStake(valHotkey, 1, {
        value: 100,
      });

      const totalColdkeyAlpha =
        await mockStakingPrecompiledPallet.totalColdkeyAlpha(ss58Address);
      expect(totalColdkeyAlpha).to.equal(100);
      const totalHotkeyAlpha =
        await mockStakingPrecompiledPallet.totalHotkeyAlpha(valHotkey);
      expect(totalHotkeyAlpha).to.equal(100);

      await mockStakingPrecompiledPallet.removeStake(valHotkey, 100, 1);
      const totalColdkeyAlphaAfter =
        await mockStakingPrecompiledPallet.totalColdkeyAlpha(ss58Address);
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
    const ss58Address = ss58ToBytes(convertH160ToSS58(address));
    await mockStakingPrecompiledPallet.setMapping(address, ss58Address);

    await mockStakingPrecompiledPallet.addUserStake(
      ss58Address,
      valHotkey,
      1,
      100,
      {
        value: 100,
      }
    );
    const bytesLikeHotkey = ss58Address;
    const totalColdkeyAlpha =
      await mockStakingPrecompiledPallet.totalColdkeyAlpha(bytesLikeHotkey);
    expect(totalColdkeyAlpha).to.equal(100);
    const totalHotkeyAlpha =
      await mockStakingPrecompiledPallet.totalHotkeyAlpha(valHotkey);
    expect(totalHotkeyAlpha).to.equal(100);

    await mockStakingPrecompiledPallet.removeStake(valHotkey, 100, 1);
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
    const ss58Address = ss58ToBytes(convertH160ToSS58(signer.address));
    await mockStakingPrecompiledPallet.setMapping(signer.address, ss58Address);
    const otherAccountSS58Address = ss58ToBytes(
      convertH160ToSS58(otherAccount.address)
    );
    await mockStakingPrecompiledPallet.setMapping(
      otherAccount.address,
      otherAccountSS58Address
    );

    await mockStakingPrecompiledPallet.connect(signer).addStake(valHotkey, 1, {
      value: 100,
    });

    await mockStakingPrecompiledPallet
      .connect(otherAccount)
      .addStake(valHotkey, 1, {
        value: 100,
      });
    const totalSignerColdkeyAlpha =
      await mockStakingPrecompiledPallet.totalColdkeyAlpha(ss58Address);
    const totalOtherAccountColdkeyAlpha =
      await mockStakingPrecompiledPallet.totalColdkeyAlpha(
        otherAccountSS58Address
      );
    const totalHotkeyAlpha =
      await mockStakingPrecompiledPallet.totalHotkeyAlpha(valHotkey);
    expect(totalHotkeyAlpha).to.equal(200);
    expect(totalSignerColdkeyAlpha).to.equal(100);
    expect(totalOtherAccountColdkeyAlpha).to.equal(100);
    const stake = await mockStakingPrecompiledPallet.getStake(
      ss58Address,
      valHotkey,
      1
    );
    expect(stake).to.equal(100);
    // Now we try to unstake from the signer address
    await mockStakingPrecompiledPallet
      .connect(signer)
      .removeStake(valHotkey, 100, 1);
    const totalHotkeyAlphaAfter =
      await mockStakingPrecompiledPallet.totalHotkeyAlpha(valHotkey);
    expect(totalHotkeyAlphaAfter).to.equal(100);
  });
});
