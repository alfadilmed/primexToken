import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, Signer } from "ethers"; // Import types

describe("NFTCollectionTemplate", function () {
  let NFTCollectionTemplate: any; // Contract factory type
  let nft: Contract; // Deployed contract instance type
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let addr3: Signer; // Added for approved transfer test

  const collectionName = "My NFT Collection";
  const collectionSymbol = "MNFT";

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners(); // Added addr3
    NFTCollectionTemplate = await ethers.getContractFactory("NFTCollectionTemplate");
    nft = await NFTCollectionTemplate.deploy(collectionName, collectionSymbol);
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await nft.name()).to.equal(collectionName);
      expect(await nft.symbol()).to.equal(collectionSymbol);
    });

    it("Should set the deployer as the owner", async function () {
      expect(await nft.owner()).to.equal(await owner.getAddress());
    });

    it("Should have an initial total supply of 0", async function () {
      expect(await nft.totalSupply()).to.equal(0);
    });
  });

  describe("Minting (safeMint)", function () {
    it("Owner should be able to mint NFTs", async function () {
      const addr1Address = await addr1.getAddress();
      await expect(nft.connect(owner).safeMint(addr1Address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1Address, 0); // Token ID 0 for the first mint

      expect(await nft.balanceOf(addr1Address)).to.equal(1);
      expect(await nft.ownerOf(0)).to.equal(addr1Address);
      expect(await nft.totalSupply()).to.equal(1);

      // Mint another one
      const ownerAddress = await owner.getAddress();
      await nft.connect(owner).safeMint(ownerAddress);
      expect(await nft.balanceOf(ownerAddress)).to.equal(1);
      expect(await nft.ownerOf(1)).to.equal(ownerAddress);
      expect(await nft.totalSupply()).to.equal(2);
    });

    it("Non-owner should not be able to mint NFTs", async function () {
      const addr1Address = await addr1.getAddress();
      await expect(
        nft.connect(addr1).safeMint(addr1Address)
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount")
       .withArgs(addr1Address);
    });
  });

  describe("Transfers", function () {
    let tokenId0: number; // Store token ID for tests
    // let addr1Address: string; // Re-fetch in tests or ensure it's set correctly if used here

    beforeEach(async function () {
      // Mint an NFT to addr1 for transfer tests
      const currentAddr1Address = await addr1.getAddress(); // Fetch inside beforeEach or pass as param
      // addr1Address = currentAddr1Address; // Assign if used class-wide, but prefer local scope
      const tx = await nft.connect(owner).safeMint(currentAddr1Address);
      // For simplicity, assuming sequential IDs starting from 0.
      // A more robust way for multiple mints or complex scenarios:
      // const receipt = await tx.wait();
      // const transferEvent = receipt.events.find(event => event.event === 'Transfer');
      // tokenId0 = transferEvent.args.tokenId;
      tokenId0 = 0; // First token minted in this beforeEach will have ID 0 if no prior mints in outer scope
    });

    it("Owner of an NFT should be able to transfer it", async function () {
      const currentAddr1Address = await addr1.getAddress();
      const currentAddr2Address = await addr2.getAddress();
      
      await expect(nft.connect(addr1).transferFrom(currentAddr1Address, currentAddr2Address, tokenId0))
        .to.emit(nft, "Transfer")
        .withArgs(currentAddr1Address, currentAddr2Address, tokenId0);

      expect(await nft.ownerOf(tokenId0)).to.equal(currentAddr2Address);
      expect(await nft.balanceOf(currentAddr1Address)).to.equal(0);
      expect(await nft.balanceOf(currentAddr2Address)).to.equal(1);
    });

    it("Approved address should be able to transfer an NFT", async function () {
      const currentAddr1Address = await addr1.getAddress();
      const currentAddr2Address = await addr2.getAddress(); // Approved spender
      const currentAddr3Address = await addr3.getAddress(); // Recipient
      
      await nft.connect(addr1).approve(currentAddr2Address, tokenId0);
      await expect(nft.connect(addr2).transferFrom(currentAddr1Address, currentAddr3Address, tokenId0))
        .to.emit(nft, "Transfer")
        .withArgs(currentAddr1Address, currentAddr3Address, tokenId0);

      expect(await nft.ownerOf(tokenId0)).to.equal(currentAddr3Address);
    });

    it("Should not allow transfer by non-owner or non-approved address", async function () {
      const currentAddr1Address = await addr1.getAddress();
      const currentAddr2Address = await addr2.getAddress();
      const currentAddr3Address = await addr3.getAddress();

      // addr2 (not owner, not approved) tries to transfer token owned by addr1
      await expect(
        nft.connect(addr2).transferFrom(currentAddr1Address, currentAddr3Address, tokenId0)
      ).to.be.revertedWithCustomError(nft, "ERC721InsufficientApproval"); 
      // Note: OZ 0.8.20+ uses ERC721InsufficientApproval. Older versions might use "ERC721NonApprovedOrNonOwner".
      // If your NFTCollectionTemplate.sol uses an older OpenZeppelin ERC721.sol, 
      // this error message might need adjustment.
      // Given the project setup, it's likely using a recent OZ version.
    });
  });

  // Add more tests for approvals, setApprovalForAll, etc. as needed.
});
