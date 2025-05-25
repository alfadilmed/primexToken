// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title BasicDAOTemplate
 * @dev A very basic DAO template for creating proposals and voting.
 * - Anyone can create a proposal.
 * - One address, one vote per proposal.
 * - Proposals pass if For > Against votes after voting period ends and quorum is met.
 * - Execution is conceptual (emits event).
 *
 * Placeholders (conceptual, to be provided as constructor arguments by backend):
 * %%QUORUM_PERCENTAGE%% (e.g., 10 for 10%) - Represents minimum % of voters from a hypothetical total voter base.
 *                                         For simplicity, let's use a fixed number of votes as quorum for this version.
 * %%OWNER_ADDRESS%%
 */
contract BasicDAOTemplate is Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _proposalIds;

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 votingDeadline;
        uint256 yesVotes;
        uint256 noVotes;
        mapping(address => bool) voters; // Tracks if an address has voted on this proposal
        bool executed; // Conceptual execution
        uint256 totalVotesCasted; // To help with quorum calculation
    }

    mapping(uint256 => Proposal) public proposals;

    // uint256 public quorumVotes; // Minimum number of total votes for a proposal to be valid

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description, uint256 votingDeadline);
    event Voted(uint256 indexed proposalId, address indexed voter, bool voteYes);
    event ProposalExecuted(uint256 indexed proposalId, bool passed); // Passed true/false

    /**
     * @param initialOwner The address that will own this DAO contract.
     * @param quorumRequiredVotes The minimum number of votes required for a proposal to be considered valid (quorum).
     */
    constructor(address initialOwner/*, uint256 quorumRequiredVotes*/) Ownable(initialOwner) {
        // require(quorumRequiredVotes > 0, "DAO: Quorum must be greater than 0");
        // quorumVotes = quorumRequiredVotes;
        // For this template, we'll make quorum implicit or testable by just total votes.
        // A more complex DAO would have explicit voter registration to calculate percentage quorum.
    }

    /**
     * @dev Creates a new proposal.
     * @param description_ Textual description of the proposal.
     * @param votingDurationSeconds_ The duration for voting on this proposal.
     */
    function createProposal(string memory description_, uint64 votingDurationSeconds_) external {
        require(votingDurationSeconds_ > 0, "DAO: Voting duration must be positive");
        _proposalIds.increment();
        uint256 newProposalId = _proposalIds.current();

        Proposal storage newProposal = proposals[newProposalId];
        newProposal.id = newProposalId;
        newProposal.proposer = msg.sender;
        newProposal.description = description_;
        newProposal.votingDeadline = block.timestamp + votingDurationSeconds_;
        // newProposal.executed = false; // Default
        // newProposal.yesVotes = 0; // Default
        // newProposal.noVotes = 0; // Default
        // newProposal.totalVotesCasted = 0; // Default


        emit ProposalCreated(newProposalId, msg.sender, description_, newProposal.votingDeadline);
    }

    /**
     * @dev Casts a vote on a proposal.
     * @param proposalId_ The ID of the proposal to vote on.
     * @param support_ True to vote FOR, false to vote AGAINST.
     */
    function vote(uint256 proposalId_, bool support_) external {
        Proposal storage p = proposals[proposalId_];
        require(p.id != 0, "DAO: Proposal does not exist"); // Check if proposal was initialized
        require(block.timestamp < p.votingDeadline, "DAO: Voting period has ended");
        require(!p.voters[msg.sender], "DAO: Already voted on this proposal");

        p.voters[msg.sender] = true;
        p.totalVotesCasted++;

        if (support_) {
            p.yesVotes++;
        } else {
            p.noVotes++;
        }

        emit Voted(proposalId_, msg.sender, support_);
    }

    /**
     * @dev Conceptually "executes" a proposal if it passed.
     * In a real DAO, this would trigger on-chain actions. Here, it just marks as executed.
     * This version requires a quorum of total votes cast.
     * @param proposalId_ The ID of the proposal to execute.
     * @param quorumRequiredVotes Minimum total votes required for proposal to be valid.
     */
    function executeProposal(uint256 proposalId_, uint256 quorumRequiredVotes) external {
        Proposal storage p = proposals[proposalId_];
        require(p.id != 0, "DAO: Proposal does not exist");
        require(block.timestamp >= p.votingDeadline, "DAO: Voting period has not ended");
        require(!p.executed, "DAO: Proposal already executed");
        require(p.totalVotesCasted >= quorumRequiredVotes, "DAO: Quorum not met");

        bool passed = p.yesVotes > p.noVotes;
        p.executed = true;

        emit ProposalExecuted(proposalId_, passed);
        
        // if (passed) {
        //   // In a real DAO:
        //   // _execute(proposalId); // internal function to perform actions
        // }
    }

    // --- View Functions ---

    function getProposal(uint256 proposalId_) 
        external 
        view 
        returns (
            uint256 id,
            address proposer,
            string memory description,
            uint256 votingDeadline,
            uint256 yesVotes,
            uint256 noVotes,
            bool executed,
            uint256 totalVotesCasted
        )
    {
        Proposal storage p = proposals[proposalId_];
        require(p.id != 0, "DAO: Proposal does not exist");
        return (
            p.id,
            p.proposer,
            p.description,
            p.votingDeadline,
            p.yesVotes,
            p.noVotes,
            p.executed,
            p.totalVotesCasted
        );
    }

    function hasVoted(uint256 proposalId_, address voter_) external view returns (bool) {
        Proposal storage p = proposals[proposalId_];
        require(p.id != 0, "DAO: Proposal does not exist");
        return p.voters[voter_];
    }

    function getCurrentProposalId() external view returns (uint256) {
        return _proposalIds.current();
    }
}
