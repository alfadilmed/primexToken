import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, Signer, BigNumberish } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("VestingWalletTemplate", function () {
  let VestingWalletTemplate: any; // Contract factory
  let vestingWallet: Contract;
  let owner: Signer; // Will be the 'initialOwner' of the VestingWalletTemplate
  let beneficiary: Signer;
  let funder: Signer; // An account to send ETH to the vesting wallet

  const oneEth = ethers.parseEther("1.0");
  const twoEth = ethers.parseEther("2.0");

  let startTime: number;
  const durationSeconds = 60 * 60 * 24 * 30; // 30 days

  beforeEach(async function () {
    [owner, beneficiary, funder] = await ethers.getSigners();
    VestingWalletTemplate = await ethers.getContractFactory("VestingWalletTemplate", owner);

    startTime = (await time.latest()) + 60; // Vesting starts 1 minute from now
    
    vestingWallet = await VestingWalletTemplate.deploy(
      await beneficiary.getAddress(),
      startTime,
      durationSeconds,
      await owner.getAddress() // This 'owner' is the Ownable owner, not necessarily the funder/beneficiary
    );
    // await vestingWallet.deployed(); // Not strictly necessary with Hardhat Network
  });

  describe("Deployment", function () {
    it("Should set the correct beneficiary", async function () {
      expect(await vestingWallet.beneficiary()).to.equal(await beneficiary.getAddress());
    });

    it("Should set the correct start time", async function () {
      expect(await vestingWallet.start()).to.equal(startTime);
    });

    it("Should set the correct duration", async function () {
      expect(await vestingWallet.duration()).to.equal(durationSeconds);
    });

    it("Should set the correct Ownable owner", async function () {
      expect(await vestingWallet.owner()).to.equal(await owner.getAddress());
    });

    it("Should initially have 0 ETH released", async function () {
      expect(await vestingWallet.released()).to.equal(0);
    });
    
    it("Should initially have 0 total balance if no ETH sent at deployment", async function () {
        expect(await ethers.provider.getBalance(await vestingWallet.getAddress())).to.equal(0);
    });
  });

  describe("Funding and Vesting", function () {
    it("Should allow ETH to be deposited via depositETH() by owner", async function () {
      await expect(vestingWallet.connect(owner).depositETH({ value: oneEth }))
        .to.changeEtherBalances([vestingWallet, owner], [oneEth, -oneEth]);
      expect(await ethers.provider.getBalance(await vestingWallet.getAddress())).to.equal(oneEth);
    });
    
    it("Should allow ETH to be deposited via receive() by anyone", async function () {
      const funderAddress = await funder.getAddress();
      await expect(funder.sendTransaction({ to: await vestingWallet.getAddress(), value: oneEth }))
        .to.changeEtherBalances([vestingWallet, funder], [oneEth, -oneEth]);
      expect(await ethers.provider.getBalance(await vestingWallet.getAddress())).to.equal(oneEth);
    });

    it("Should not allow non-owner to call depositETH()", async function () {
      await expect(
        vestingWallet.connect(beneficiary).depositETH({ value: oneEth })
      ).to.be.revertedWithCustomError(vestingWallet, "OwnableUnauthorizedAccount")
       .withArgs(await beneficiary.getAddress());
    });
    
    it("Should have 0 vested amount before start time", async function () {
        await funder.sendTransaction({ to: await vestingWallet.getAddress(), value: twoEth });
        expect(await vestingWallet.vestedAmount(await time.latest())).to.equal(0);
    });

    it("Should calculate vested amount correctly at start time (should be 0 or very small)", async function () {
      await funder.sendTransaction({ to: await vestingWallet.getAddress(), value: twoEth });
      await time.increaseTo(startTime);
      // Due to potential for block timestamp to be slightly ahead, it might vest a tiny fraction.
      // A more robust check is that it's less than a full period's worth.
      // For simplicity, we check it's very small or zero.
      const vested = await vestingWallet.vestedAmount(startTime);
      expect(vested).to.be.gte(0); // Greater than or equal to 0
      // It should be much less than total if duration is significant
      expect(vested).to.be.lt(ethers.parseUnits("0.0001", 18)); // Example: less than 0.0001 ETH
    });
    
    it("Should calculate half vested amount at half duration", async function () {
      await funder.sendTransaction({ to: await vestingWallet.getAddress(), value: twoEth });
      await time.increaseTo(startTime + durationSeconds / 2);
      // Using a tolerance because block timestamps can make exact calculations tricky
      expect(await vestingWallet.vestedAmount(await time.latest())).to.be.closeTo(oneEth, ethers.parseUnits("0.01", "ether"));
    });

    it("Should calculate full vested amount after duration", async function () {
      await funder.sendTransaction({ to: await vestingWallet.getAddress(), value: twoEth });
      await time.increaseTo(startTime + durationSeconds);
      expect(await vestingWallet.vestedAmount(await time.latest())).to.equal(twoEth);
    });
  });

  describe("Release", function () {
    beforeEach(async function() {
      // Fund the wallet
      await owner.sendTransaction({ to: await vestingWallet.getAddress(), value: twoEth });
    });

    it("Beneficiary should be able to release vested ETH", async function () {
      await time.increaseTo(startTime + durationSeconds / 2); // Half vested
      const vestedAmount = await vestingWallet.vestedAmount(await time.latest());
      expect(vestedAmount).to.be.closeTo(oneEth, ethers.parseUnits("0.01", "ether"));

      const initialBeneficiaryBalance = await ethers.provider.getBalance(await beneficiary.getAddress());
      
      // Anyone can call release, funds go to beneficiary
      const releaseTx = await vestingWallet.connect(contributor1).release(); 
      await releaseTx.wait();
      
      const finalBeneficiaryBalance = await ethers.provider.getBalance(await beneficiary.getAddress());
      // Check that beneficiary's balance increased by approximately the vested amount
      // (accounting for gas is tricky for exact match without being the caller)
      expect(finalBeneficiaryBalance).to.be.gt(initialBeneficiaryBalance); // General check
      // A more precise check would be on the contract's released amount
      expect(await vestingWallet.released()).to.equal(vestedAmount);
      expect(await ethers.provider.getBalance(await vestingWallet.getAddress())).to.equal(twoEth - vestedAmount);
    });

    it("Should release all funds if called after full vesting period", async function () {
      await time.increaseTo(startTime + durationSeconds);
      const initialBeneficiaryBalance = await ethers.provider.getBalance(await beneficiary.getAddress());
      
      await vestingWallet.connect(beneficiary).release(); // Beneficiary calls release

      expect(await vestingWallet.released()).to.equal(twoEth);
      expect(await ethers.provider.getBalance(await vestingWallet.getAddress())).to.equal(0);
      expect(await ethers.provider.getBalance(await beneficiary.getAddress())).to.be.closeTo(initialBeneficiaryBalance + twoEth, ethers.parseUnits("0.1", "ether")); // Account for gas
    });
    
    it("Releasing when no funds are vested should not transfer ETH and not revert", async function () {
      const initialBeneficiaryBalance = await ethers.provider.getBalance(await beneficiary.getAddress());
      const initialReleasedAmount = await vestingWallet.released();
      
      // Try to release before start time
      await expect(vestingWallet.connect(beneficiary).release()).to.not.be.reverted;
      
      expect(await ethers.provider.getBalance(await beneficiary.getAddress())).to.equal(initialBeneficiaryBalance); // No ETH transferred
      expect(await vestingWallet.released()).to.equal(initialReleasedAmount); // No change in released amount
    });

    it("Releasing multiple times should release incrementally vested amounts", async function () {
      // First release at half time
      await time.increaseTo(startTime + durationSeconds / 2);
      let vestedAtHalf = await vestingWallet.vestedAmount(await time.latest());
      await vestingWallet.connect(beneficiary).release();
      let releasedSoFar = await vestingWallet.released();
      expect(releasedSoFar).to.equal(vestedAtHalf);

      // Second release at full time
      await time.increaseTo(startTime + durationSeconds);
      let vestedAtFull = await vestingWallet.vestedAmount(await time.latest()); // This is total vested, not incremental
      await vestingWallet.connect(beneficiary).release();
      
      expect(await vestingWallet.released()).to.equal(vestedAtFull); // Total released should be total vested
      expect(await ethers.provider.getBalance(await vestingWallet.getAddress())).to.equal(0); // All funds released
    });
  });
});
