import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, Signer } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("BasicDAOTemplate", function () {
  let BasicDAOTemplate: any; // Contract factory
  let dao: Contract;
  let owner: Signer;         // Deployer and Ownable owner
  let proposer1: Signer;
  let voter1: Signer;
  let voter2: Signer;
  let voter3: Signer;

  const votingDurationSeconds = 7 * 24 * 60 * 60; // 7 days
  const quorumRequiredVotesForExecution = 2; // Example quorum

  beforeEach(async function () {
    [owner, proposer1, voter1, voter2, voter3] = await ethers.getSigners();
    BasicDAOTemplate = await ethers.getContractFactory("BasicDAOTemplate", owner);
    dao = await BasicDAOTemplate.deploy(await owner.getAddress());
    // await dao.deployed(); // Not strictly needed
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await dao.owner()).to.equal(await owner.getAddress());
    });

    it("Should initialize proposal ID counter to 0", async function () {
      expect(await dao.getCurrentProposalId()).to.equal(0);
    });
  });

  describe("Proposal Creation", function () {
    it("Anyone should be able to create a proposal", async function () {
      const propDesc = "Proposal 1: Fund project Alpha";
      const expectedDeadline = (await time.latest()) + votingDurationSeconds + 1; // +1 for next block

      await expect(dao.connect(proposer1).createProposal(propDesc, votingDurationSeconds))
        .to.emit(dao, "ProposalCreated")
        .withArgs(1, await proposer1.getAddress(), propDesc, (deadline: any) => deadline >= expectedDeadline -5 && deadline <= expectedDeadline +5 ); // Check deadline with tolerance

      const proposal = await dao.getProposal(1);
      expect(proposal.id).to.equal(1);
      expect(proposal.proposer).to.equal(await proposer1.getAddress());
      expect(proposal.description).to.equal(propDesc);
      expect(proposal.yesVotes).to.equal(0);
      expect(proposal.noVotes).to.equal(0);
      expect(proposal.executed).to.be.false;
      expect(proposal.totalVotesCasted).to.equal(0);
      expect(await dao.getCurrentProposalId()).to.equal(1);
    });

    it("Should revert if voting duration is zero", async function () {
      await expect(
        dao.connect(proposer1).createProposal("Invalid duration", 0)
      ).to.be.revertedWith("DAO: Voting duration must be positive");
    });
  });

  describe("Voting", function () {
    let proposalId: number;

    beforeEach(async function() {
      await dao.connect(proposer1).createProposal("Test Proposal for Voting", votingDurationSeconds);
      proposalId = await dao.getCurrentProposalId();
    });

    it("Should allow users to vote FOR a proposal", async function () {
      await expect(dao.connect(voter1).vote(proposalId, true))
        .to.emit(dao, "Voted")
        .withArgs(proposalId, await voter1.getAddress(), true);
      
      const p = await dao.getProposal(proposalId);
      expect(p.yesVotes).to.equal(1);
      expect(p.noVotes).to.equal(0);
      expect(p.totalVotesCasted).to.equal(1);
      expect(await dao.hasVoted(proposalId, await voter1.getAddress())).to.be.true;
    });

    it("Should allow users to vote AGAINST a proposal", async function () {
      await dao.connect(voter2).vote(proposalId, false);
      const p = await dao.getProposal(proposalId);
      expect(p.yesVotes).to.equal(0);
      expect(p.noVotes).to.equal(1);
      expect(p.totalVotesCasted).to.equal(1);
    });

    it("Should not allow voting on a non-existent proposal", async function () {
      await expect(dao.connect(voter1).vote(99, true))
        .to.be.revertedWith("DAO: Proposal does not exist");
    });

    it("Should not allow voting twice on the same proposal", async function () {
      await dao.connect(voter1).vote(proposalId, true);
      await expect(dao.connect(voter1).vote(proposalId, false)) // Try to change vote or vote again
        .to.be.revertedWith("DAO: Already voted on this proposal");
    });

    it("Should not allow voting after the deadline", async function () {
      const p = await dao.getProposal(proposalId);
      await time.increaseTo(p.votingDeadline + BigInt(1));
      await expect(dao.connect(voter1).vote(proposalId, true))
        .to.be.revertedWith("DAO: Voting period has ended");
    });
  });

  describe("Proposal Execution", function () {
    let proposalId1: number;

    beforeEach(async function() {
      // Proposal 1
      await dao.connect(proposer1).createProposal("Execute Me - Yes Wins", votingDurationSeconds);
      proposalId1 = await dao.getCurrentProposalId();
      await dao.connect(voter1).vote(proposalId1, true); // Yes
      await dao.connect(voter2).vote(proposalId1, true); // Yes
      await dao.connect(voter3).vote(proposalId1, false); // No
      // Total: 2 Yes, 1 No. Total 3 votes.
    });
    
    it("Should allow execution if deadline passed, quorum met, and yes > no", async function () {
      const pBefore = await dao.getProposal(proposalId1);
      await time.increaseTo(pBefore.votingDeadline + BigInt(1));

      await expect(dao.connect(owner).executeProposal(proposalId1, quorumRequiredVotesForExecution))
        .to.emit(dao, "ProposalExecuted")
        .withArgs(proposalId1, true); // true for passed

      const pAfter = await dao.getProposal(proposalId1);
      expect(pAfter.executed).to.be.true;
    });

    it("Should not allow execution if quorum not met", async function () {
      const p = await dao.getProposal(proposalId1);
      await time.increaseTo(p.votingDeadline + BigInt(1));
      const highQuorum = p.totalVotesCasted + BigInt(1);

      await expect(
        dao.connect(owner).executeProposal(proposalId1, highQuorum)
      ).to.be.revertedWith("DAO: Quorum not met");
    });
    
    it("Should not execute if no > yes or yes == no", async function () {
      // Create new proposal where No wins
      await dao.connect(proposer1).createProposal("Execute Me - No Wins", votingDurationSeconds);
      const proposalId2 = await dao.getCurrentProposalId();
      await dao.connect(voter1).vote(proposalId2, false);
      await dao.connect(voter2).vote(proposalId2, false);
      await dao.connect(voter3).vote(proposalId2, true);
      // Total: 1 Yes, 2 No. Total 3 votes.

      const p2 = await dao.getProposal(proposalId2);
      await time.increaseTo(p2.votingDeadline + BigInt(1));

      await expect(dao.connect(owner).executeProposal(proposalId2, quorumRequiredVotesForExecution))
        .to.emit(dao, "ProposalExecuted")
        .withArgs(proposalId2, false); // false for not passed (No > Yes)
      
      const p2After = await dao.getProposal(proposalId2);
      expect(p2After.executed).to.be.true; // Still marked executed, but outcome is 'false'
    });

    it("Should not allow execution before deadline", async function () {
      await expect(
        dao.connect(owner).executeProposal(proposalId1, quorumRequiredVotesForExecution)
      ).to.be.revertedWith("DAO: Voting period has not ended");
    });

    it("Should not allow execution twice", async function () {
      const p = await dao.getProposal(proposalId1);
      await time.increaseTo(p.votingDeadline + BigInt(1));
      await dao.connect(owner).executeProposal(proposalId1, quorumRequiredVotesForExecution); // First execution
      
      await expect(
        dao.connect(owner).executeProposal(proposalId1, quorumRequiredVotesForExecution)
      ).to.be.revertedWith("DAO: Proposal already executed");
    });
    
    it("Should not execute non-existent proposal", async function () {
        await expect(
            dao.connect(owner).executeProposal(999, quorumRequiredVotesForExecution)
        ).to.be.revertedWith("DAO: Proposal does not exist");
    });
  });
});
