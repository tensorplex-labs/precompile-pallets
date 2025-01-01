import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { valHotkey } from "./helpers/constants";
import { convertH160ToSS58, ss58ToBytes } from "./helpers/addressMapping";
import {
  deployPrecompiledPallet,
  deploySubnetPrecompiledPallet,
} from "./helpers/deploy";

describe("Precompiled Subnet Pallets", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  describe("Test Precompiled Subnet Pallet", function () {
    it("Should be able to register a hotkey to the subnet", async function () {
      const { subnetPrecompiledPallet, owner } =
        await deploySubnetPrecompiledPallet();
      await subnetPrecompiledPallet.burnedRegister(1, valHotkey);
      const registeredUsers = await subnetPrecompiledPallet.getRegisteredUsers(
        1
      );
      expect(registeredUsers[0]).to.equal(valHotkey);
      // burnedRegister should cause an error
      await expect(
        subnetPrecompiledPallet.burnedRegister(1, valHotkey)
      ).to.be.revertedWith("Hotkey already registered for this subnet");
    });
  });
});
