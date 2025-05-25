// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title VotingTemplate
 * @dev A template for a basic voting system.
 * Allows an owner to create proposals, and any address to vote.
 * This is a simplified model and does not include token-based voting or complex governance.
 */
contract VotingTemplate is Ownable {
    using Counters for Counters.Counter;

    // Counter for proposal IDs
    Counters.Counter private _proposalIds;

    struct Proposal {
        uint256 id;
        string description;
        uint256 voteCountFor; // Number of votes for the proposal
        uint256 voteCountAgainst; // Number of votes against the proposal
        // uint256 deadline; // Optional: timestamp for when voting ends
        // mapping(address => bool) hasVoted; // Optional: track if an address has voted on this proposal
        bool exists; // To check if a proposal ID is valid
    }

    // Mapping from proposal ID to Proposal struct
    mapping(uint256 => Proposal) public proposals;

    // Mapping from user address to proposal ID to their vote (true for 'For', false for 'Against')
    // This simple model allows one vote per user per proposal.
    mapping(address => mapping(uint256 => bool)) public userHasVotedOnProposal;
    mapping(address => mapping(uint256 => bool)) public userVoteChoice; // true for For, false for Against


    event ProposalCreated(uint256 indexed proposalId, string description, address indexed proposer);
    event Voted(uint256 indexed proposalId, address indexed voter, bool voteFor);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() Ownable(msg.sender) {
        // Owner is set by Ownable constructor
    }

    /**
     * @dev Creates a new proposal.
     * Can only be called by the contract owner.
     * @param description_ Textual description of the proposal.
     */
    function createProposal(string memory description_) public onlyOwner {
        _proposalIds.increment();
        uint256 newProposalId = _proposalIds.current();

        proposals[newProposalId] = Proposal({
            id: newProposalId,
            description: description_,
            voteCountFor: 0,
            voteCountAgainst: 0,
            // deadline: block.timestamp + 7 days; // Example: 7 day voting period
            exists: true
        });

        emit ProposalCreated(newProposalId, description_, msg.sender);
    }

    /**
     * @dev Allows any address to cast a vote on an existing proposal.
     * A user can only vote once per proposal.
     * @param proposalId_ The ID of the proposal to vote on.
     * @param voteFor_ True to vote 'For', false to vote 'Against'.
     */
    function vote(uint256 proposalId_, bool voteFor_) public {
        require(proposals[proposalId_].exists, "VotingTemplate: Proposal does not exist");
        // require(block.timestamp < proposals[proposalId_].deadline, "VotingTemplate: Voting period has ended"); // If using deadlines
        require(!userHasVotedOnProposal[msg.sender][proposalId_], "VotingTemplate: Already voted on this proposal");

        if (voteFor_) {
            proposals[proposalId_].voteCountFor++;
        } else {
            proposals[proposalId_].voteCountAgainst++;
        }
        
        userHasVotedOnProposal[msg.sender][proposalId_] = true;
        userVoteChoice[msg.sender][proposalId_] = voteFor_;

        emit Voted(proposalId_, msg.sender, voteFor_);
    }

    /**
     * @dev Retrieves the details of a proposal.
     * @param proposalId_ The ID of the proposal.
     * @return The proposal description, vote count for, and vote count against.
     */
    function getProposal(uint256 proposalId_) public view 
        returns (string memory description, uint256 voteCountFor, uint256 voteCountAgainst) 
    {
        require(proposals[proposalId_].exists, "VotingTemplate: Proposal does not exist");
        Proposal storage p = proposals[proposalId_];
        return (p.description, p.voteCountFor, p.voteCountAgainst);
    }
    
    /**
     * @dev Checks if a user has voted on a specific proposal and their choice.
     * @param user The address of the user.
     * @param proposalId_ The ID of the proposal.
     * @return hasVoted True if the user has voted, false otherwise.
     * @return choice The user's vote choice (true for 'For', false for 'Against'), only valid if hasVoted is true.
     */
    function getVoteOfUser(address user, uint256 proposalId_) public view 
        returns (bool hasVoted, bool choice)
    {
        require(proposals[proposalId_].exists, "VotingTemplate: Proposal does not exist");
        return (userHasVotedOnProposal[user][proposalId_], userVoteChoice[user][proposalId_]);
    }
}
