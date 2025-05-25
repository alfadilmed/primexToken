import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, Signer } from "ethers"; // Import types

describe("VotingTemplate", function () {
  let VotingTemplate: any; // Contract factory type
  let voting: Contract;    // Deployed contract instance type
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let addr3: Signer;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    VotingTemplate = await ethers.getContractFactory("VotingTemplate");
    voting = await VotingTemplate.deploy();
  });

  describe("Deployment", function () {
    it("Should set the deployer as the owner", async function () {
      expect(await voting.owner()).to.equal(await owner.getAddress());
    });
  });

  describe("Proposal Creation", function () {
    it("Owner should be able to create a proposal", async function () {
      const proposalDescription = "Proposal 1: Fund project Alpha";
      // Estimate gas for createProposal
      // const gasEstimate = await voting.connect(owner).createProposal.estimateGas(proposalDescription);
      // console.log(`Estimated gas for createProposal: ${gasEstimate.toString()}`);

      await expect(voting.connect(owner).createProposal(proposalDescription))
        .to.emit(voting, "ProposalCreated")
        .withArgs(1, proposalDescription, await owner.getAddress()); // Proposal ID should be 1

      const proposal = await voting.proposals(1);
      expect(proposal.id).to.equal(1);
      expect(proposal.description).to.equal(proposalDescription);
      expect(proposal.voteCountFor).to.equal(0);
      expect(proposal.voteCountAgainst).to.equal(0);
      expect(proposal.exists).to.be.true;
    });

    it("Non-owner should not be able to create a proposal", async function () {
      const proposalDescription = "Proposal 2: Unauthorized proposal";
      const addr1Address = await addr1.getAddress();
      await expect(
        voting.connect(addr1).createProposal(proposalDescription)
      ).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount")
       .withArgs(addr1Address);
    });

    it("Should increment proposal IDs correctly", async function () {
      await voting.connect(owner).createProposal("First proposal");
      await voting.connect(owner).createProposal("Second proposal");
      
      const proposal2 = await voting.proposals(2);
      expect(proposal2.id).to.equal(2);
      expect(proposal2.description).to.equal("Second proposal");
    });
  });

  describe("Voting", function () {
    let proposalId1: number;

    beforeEach(async function () {
      // Create a proposal for voting tests
      await voting.connect(owner).createProposal("Test Proposal for Voting");
      proposalId1 = 1; // First proposal ID
    });

    it("Should allow an address to vote 'For' a proposal", async function () {
      const addr1Address = await addr1.getAddress();
      await expect(voting.connect(addr1).vote(proposalId1, true))
        .to.emit(voting, "Voted")
        .withArgs(proposalId1, addr1Address, true);

      const proposal = await voting.proposals(proposalId1);
      expect(proposal.voteCountFor).to.equal(1);
      expect(proposal.voteCountAgainst).to.equal(0);
      
      const [hasVoted, choice] = await voting.getVoteOfUser(addr1Address, proposalId1);
      expect(hasVoted).to.be.true;
      expect(choice).to.be.true; // true for 'For'
    });

    it("Should allow an address to vote 'Against' a proposal", async function () {
      const addr2Address = await addr2.getAddress();
      await expect(voting.connect(addr2).vote(proposalId1, false))
        .to.emit(voting, "Voted")
        .withArgs(proposalId1, addr2Address, false);

      const proposal = await voting.proposals(proposalId1);
      expect(proposal.voteCountFor).to.equal(0);
      expect(proposal.voteCountAgainst).to.equal(1);

      const [hasVoted, choice] = await voting.getVoteOfUser(addr2Address, proposalId1);
      expect(hasVoted).to.be.true;
      expect(choice).to.be.false; // false for 'Against'
    });

    it("Should not allow voting on a non-existent proposal", async function () {
      const nonExistentProposalId = 99;
      await expect(
        voting.connect(addr1).vote(nonExistentProposalId, true)
      ).to.be.revertedWith("VotingTemplate: Proposal does not exist");
    });

    it("Should not allow an address to vote twice on the same proposal", async function () {
      await voting.connect(addr1).vote(proposalId1, true); // First vote
      await expect(
        voting.connect(addr1).vote(proposalId1, false) // Second attempt
      ).to.be.revertedWith("VotingTemplate: Already voted on this proposal");
    });
    
    it("Multiple addresses should be able to vote on the same proposal", async function () {
        const addr1Address = await addr1.getAddress();
        const addr2Address = await addr2.getAddress();
        const addr3Address = await addr3.getAddress();

        await voting.connect(addr1).vote(proposalId1, true); // Vote For
        await voting.connect(addr2).vote(proposalId1, false); // Vote Against
        await voting.connect(addr3).vote(proposalId1, true); // Vote For

        const proposal = await voting.proposals(proposalId1);
        expect(proposal.voteCountFor).to.equal(2);
        expect(proposal.voteCountAgainst).to.equal(1);
    });
  });

  describe("Retrieving Proposal and Vote Information", function () {
    let proposalId1: number;
    const proposalDesc1 = "Test Proposal for Info";

    beforeEach(async function () {
      await voting.connect(owner).createProposal(proposalDesc1);
      proposalId1 = 1;
      await voting.connect(addr1).vote(proposalId1, true);
      await voting.connect(addr2).vote(proposalId1, false);
    });

    it("getProposal should return correct details", async function () {
      const [description, votesFor, votesAgainst] = await voting.getProposal(proposalId1);
      expect(description).to.equal(proposalDesc1);
      expect(votesFor).to.equal(1);
      expect(votesAgainst).to.equal(1);
    });

    it("getProposal should revert for non-existent proposal", async function () {
        await expect(voting.getProposal(99))
            .to.be.revertedWith("VotingTemplate: Proposal does not exist");
    });

    it("getVoteOfUser should return correct voting status and choice", async function () {
      const addr1Address = await addr1.getAddress();
      const addr2Address = await addr2.getAddress();
      const addr3Address = await addr3.getAddress();

      const [votedAddr1, choiceAddr1] = await voting.getVoteOfUser(addr1Address, proposalId1);
      expect(votedAddr1).to.be.true;
      expect(choiceAddr1).to.be.true;

      const [votedAddr2, choiceAddr2] = await voting.getVoteOfUser(addr2Address, proposalId1);
      expect(votedAddr2).to.be.true;
      expect(choiceAddr2).to.be.false;
      
      const [votedAddr3, choiceAddr3] = await voting.getVoteOfUser(addr3Address, proposalId1);
      expect(votedAddr3).to.be.false; // Addr3 hasn't voted
      // Choice for addr3 can be default (false), check contract logic if specific default matters
    });
    
    it("getVoteOfUser should revert for non-existent proposal", async function () {
        const addr1Address = await addr1.getAddress();
        await expect(voting.getVoteOfUser(addr1Address, 99))
            .to.be.revertedWith("VotingTemplate: Proposal does not exist");
    });
  });
});
