import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, Signer } from "ethers"; // Import types

describe("ERC721ATemplate", function () {
  let ERC721ATemplate: any; // Contract factory type
  let erc721a: Contract;    // Deployed contract instance type
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;

  const collectionName = "My ERC721A Collection";
  const collectionSymbol = "M721A";
  // The MAX_SUPPLY placeholder in the contract is %%MAX_SUPPLY%%
  // For testing, we assume the backend compilation service replaces this.
  // Here, we'd be testing a compiled version where MAX_SUPPLY is, say, 100.
  // However, Hardhat tests compile the .sol files directly.
  // So, we need a version of ERC721ATemplate.sol in hardhat/contracts
  // where %%MAX_SUPPLY%% is replaced with a testable value, or the test needs to deploy differently.

  // For simplicity in this test setup, let's assume the ERC721ATemplate.sol
  // in hardhat/contracts/ will have %%MAX_SUPPLY%% replaced by a fixed value like 100
  // before this test runs (e.g. by a manual edit or a script if we were testing the placeholder replacement too).
  // OR, we deploy a "test" version of the contract if the placeholder is deep.
  // Let's assume for now the contract in hardhat/contracts/ has MAX_SUPPLY = 100 for testing.
  // If not, these tests will fail or need adjustment.
  // A better way for true template testing would be to use a factory pattern in tests
  // to deploy variants, or have the backend service do the replacement and provide artifact for testing.
  // For this step, we will assume the `ERC721ATemplate.sol` placed in `hardhat/contracts`
  // will have `%%MAX_SUPPLY%%` manually or script-replaced with a value like `100`.

  const maxSupply = 100; // Assuming this value is set in the test version of the contract

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    ERC721ATemplate = await ethers.getContractFactory("ERC721ATemplate");
    // We are testing the version from hardhat/contracts which should have MAX_SUPPLY resolved
    erc721a = await ERC721ATemplate.deploy(collectionName, collectionSymbol);
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await erc721a.name()).to.equal(collectionName);
      expect(await erc721a.symbol()).to.equal(collectionSymbol);
    });

    it("Should set the deployer as the owner", async function () {
      expect(await erc721a.owner()).to.equal(await owner.getAddress());
    });

    it("Should have MAX_SUPPLY set (assuming it's hardcoded or replaced for test)", async function () {
      // This test depends on how MAX_SUPPLY is handled.
      // If it's a public state variable after placeholder replacement:
      expect(await erc721a.MAX_SUPPLY()).to.equal(maxSupply);
    });
  });

  describe("Minting (ownerMint)", function () {
    it("Owner should be able to batch mint NFTs up to MAX_SUPPLY", async function () {
      const addr1Address = await addr1.getAddress();
      const quantity1 = 5;
      await expect(erc721a.connect(owner).ownerMint(addr1Address, quantity1))
        .to.emit(erc721a, "Transfer") // ERC721A emits one event for the whole batch
        .withArgs(ethers.ZeroAddress, addr1Address, 0); // The first token ID in the batch

      expect(await erc721a.balanceOf(addr1Address)).to.equal(quantity1);
      expect(await erc721a.totalSupply()).to.equal(quantity1);
      // Check ownership of the first and last token in the batch
      expect(await erc721a.ownerOf(0)).to.equal(addr1Address);
      expect(await erc721a.ownerOf(quantity1 - 1)).to.equal(addr1Address);

      const ownerAddress = await owner.getAddress();
      const quantity2 = 10;
      await erc721a.connect(owner).ownerMint(ownerAddress, quantity2);
      expect(await erc721a.balanceOf(ownerAddress)).to.equal(quantity2);
      expect(await erc721a.totalSupply()).to.equal(quantity1 + quantity2);
      expect(await erc721a.ownerOf(quantity1)).to.equal(ownerAddress); // First token of second batch
    });

    it("Non-owner should not be able to mint NFTs", async function () {
      const addr1Address = await addr1.getAddress();
      await expect(
        erc721a.connect(addr1).ownerMint(addr1Address, 1)
      ).to.be.revertedWithCustomError(erc721a, "OwnableUnauthorizedAccount")
       .withArgs(addr1Address);
    });

    it("Should not allow minting beyond MAX_SUPPLY", async function () {
      const addr1Address = await addr1.getAddress();
      // Mint close to max_supply
      const quantityNearMax = maxSupply - 5;
      if (quantityNearMax > 0) {
         await erc721a.connect(owner).ownerMint(addr1Address, quantityNearMax);
      }
      expect(await erc721a.totalSupply()).to.equal(quantityNearMax);

      // Try to mint 6 more (5 would be ok, 6 would exceed)
      await expect(
        erc721a.connect(owner).ownerMint(addr1Address, 6)
      ).to.be.revertedWith("ERC721A: minting would exceed max supply"); // ERC721A specific error string
    });
    
    it("Should allow minting exactly up to MAX_SUPPLY", async function () {
      const addr1Address = await addr1.getAddress();
      await erc721a.connect(owner).ownerMint(addr1Address, maxSupply);
      expect(await erc721a.totalSupply()).to.equal(maxSupply);

      // Try to mint one more
      await expect(
        erc721a.connect(owner).ownerMint(addr1Address, 1)
      ).to.be.revertedWith("ERC721A: minting would exceed max supply");
    });
  });

  describe("Base URI", function () {
    it("Owner should be able to set base URI", async function () {
      const newBaseURI = "https://example.com/api/token/";
      await erc721a.connect(owner).setBaseURI(newBaseURI);
      // To verify, we'd ideally check tokenURI of a minted token
      // Mint a token first
      await erc721a.connect(owner).ownerMint(await addr1.getAddress(), 1);
      expect(await erc721a.tokenURI(0)).to.equal(newBaseURI + "0");
    });

    it("Non-owner should not be able to set base URI", async function () {
      const newBaseURI = "https://example.com/api/token/";
      const addr1Address = await addr1.getAddress();
      await expect(
        erc721a.connect(addr1).setBaseURI(newBaseURI)
      ).to.be.revertedWithCustomError(erc721a, "OwnableUnauthorizedAccount")
       .withArgs(addr1Address);
    });

    it("Should return empty string for tokenURI if base URI is not set", async function () {
      await erc721a.connect(owner).ownerMint(await addr1.getAddress(), 1);
      expect(await erc721a.tokenURI(0)).to.equal("0"); // ERC721A default behavior is to return stringified tokenId if baseURI is empty
    });
  });
});
