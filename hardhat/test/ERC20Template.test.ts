import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, Signer } from "ethers"; // Import Contract and Signer types

describe("ERC20Template", function () {
  let ERC20Template: any; // Using any for contract factory type
  let erc20: Contract; // Using Contract type for deployed instance
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  // let addrs: Signer[]; // If more signers are needed

  const tokenName = "Test Token";
  const tokenSymbol = "TST";
  const initialSupply = ethers.parseUnits("1000000", 18); // 1,000,000 tokens with 18 decimals

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2] = await ethers.getSigners(); // Using array destructuring
    
    // Correctly get the contract factory using its deployed name
    // If the .sol file is ERC20Template.sol and contract is ERC20Template:
    ERC20Template = await ethers.getContractFactory("ERC20Template");

    // Deploy the contract
    erc20 = await ERC20Template.deploy(tokenName, tokenSymbol, initialSupply);
    // await erc20.deployed(); // Not needed with Hardhat Network, deployment is instant
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      // OpenZeppelin's ERC20 doesn't have an 'owner()' function by default.
      // Ownership for minting in our template is implicit (msg.sender in constructor).
      // This test can be about checking initial balances or other deployment params.
      expect(await erc20.balanceOf(await owner.getAddress())).to.equal(initialSupply);
    });

    it("Should assign the total supply of tokens to the deployer (owner)", async function () {
      const ownerBalance = await erc20.balanceOf(await owner.getAddress());
      expect(await erc20.totalSupply()).to.equal(ownerBalance);
      expect(ownerBalance).to.equal(initialSupply);
    });

    it("Should have the correct name and symbol", async function () {
      expect(await erc20.name()).to.equal(tokenName);
      expect(await erc20.symbol()).to.equal(tokenSymbol);
    });

    it("Should have the correct decimals (18 by default from OZ ERC20)", async function () {
      expect(await erc20.decimals()).to.equal(18);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const ownerAddress = await owner.getAddress();
      const addr1Address = await addr1.getAddress();
      const addr2Address = await addr2.getAddress();

      // Transfer 50 tokens from owner to addr1
      await erc20.connect(owner).transfer(addr1Address, 50);
      const addr1Balance = await erc20.balanceOf(addr1Address);
      expect(addr1Balance).to.equal(50);

      // Transfer 50 tokens from addr1 to addr2
      await erc20.connect(addr1).transfer(addr2Address, 50);
      const addr2Balance = await erc20.balanceOf(addr2Address);
      expect(addr2Balance).to.equal(50);
      
      const ownerBalance = await erc20.balanceOf(ownerAddress);
      // initialSupply is BigNumber, 50 is number. Ensure types match or convert.
      expect(ownerBalance).to.equal(initialSupply - BigInt(50)); 
    });

    it("Should fail if sender doesn’t have enough tokens", async function () {
      const ownerAddress = await owner.getAddress();
      const addr1Address = await addr1.getAddress();
      const initialOwnerBalance = await erc20.balanceOf(ownerAddress);

      // Try to send 1 token from addr1 (0 tokens) to owner.
      // `require` will evaluate false and revert the transaction.
      await expect(
        erc20.connect(addr1).transfer(ownerAddress, 1)
      ).to.be.revertedWithCustomError(erc20, "ERC20InsufficientBalance"); // OZ ERC20 error

      // Owner balance shouldn't have changed.
      expect(await erc20.balanceOf(ownerAddress)).to.equal(initialOwnerBalance);
    });

    it("Should update balances after transfers", async function () {
      const ownerAddress = await owner.getAddress();
      const addr1Address = await addr1.getAddress();
      const addr2Address = await addr2.getAddress();
      const initialOwnerBalance = await erc20.balanceOf(ownerAddress);

      // Transfer 100 tokens from owner to addr1.
      await erc20.connect(owner).transfer(addr1Address, 100);

      // Transfer 50 tokens from addr1 to addr2.
      await erc20.connect(addr1).transfer(addr2Address, 50);

      expect(await erc20.balanceOf(ownerAddress)).to.equal(initialOwnerBalance - BigInt(100));
      expect(await erc20.balanceOf(addr1Address)).to.equal(50);
      expect(await erc20.balanceOf(addr2Address)).to.equal(50);
    });
  });

  describe("Approvals", function () {
    it("Should allow spender to withdraw from owner's account", async function () {
      const ownerAddress = await owner.getAddress();
      const addr1Address = await addr1.getAddress(); // Spender
      const addr2Address = await addr2.getAddress(); // Recipient

      // Owner approves addr1 to spend 100 tokens
      await erc20.connect(owner).approve(addr1Address, 100);
      expect(await erc20.allowance(ownerAddress, addr1Address)).to.equal(100);

      // Addr1 (spender) transfers 50 tokens from owner to addr2
      await erc20.connect(addr1).transferFrom(ownerAddress, addr2Address, 50);
      
      expect(await erc20.balanceOf(ownerAddress)).to.equal(initialSupply - BigInt(50));
      expect(await erc20.balanceOf(addr2Address)).to.equal(50);
      expect(await erc20.allowance(ownerAddress, addr1Address)).to.equal(50); // Allowance decreased
    });

    it("Should fail if spender tries to withdraw more than allowance or balance", async function () {
      const ownerAddress = await owner.getAddress();
      const addr1Address = await addr1.getAddress(); // Spender
      const addr2Address = await addr2.getAddress(); // Recipient

      await erc20.connect(owner).approve(addr1Address, 50);

      // Spender tries to transfer 100 (allowance is 50)
      await expect(
        erc20.connect(addr1).transferFrom(ownerAddress, addr2Address, 100)
      ).to.be.revertedWithCustomError(erc20, "ERC20InsufficientAllowance");

      // Spender tries to transfer from an account with insufficient balance (even if allowance is enough)
      // For this, let's assume owner only has 30 tokens but allowance is 50.
      // First, reduce owner's balance to 30 (initialSupply - (initialSupply - 30))
      if (initialSupply > BigInt(30)) {
         await erc20.connect(owner).transfer(addr2Address, initialSupply - BigInt(30)); // Send away most tokens
      }
      // Now owner has 30 tokens. Approve addr1 to spend 50.
      await erc20.connect(owner).approve(addr1Address, 50);
      await expect(
        erc20.connect(addr1).transferFrom(ownerAddress, addr2Address, 40) // Try to spend 40, owner has 30
      ).to.be.revertedWithCustomError(erc20, "ERC20InsufficientBalance");
    });
  });
});
