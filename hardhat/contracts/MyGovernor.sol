// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; // Using a more recent 0.8.x version for Governor

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol"; // Required for ERC20Votes
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

/**
 * @title MyGovernor
 * @dev A configurable Governor contract based on OpenZeppelin's Governor framework.
 * - Uses an ERC20Votes compatible token for voting power.
 * - Implements a percentage-based quorum.
 * - Integrates with a TimelockController for proposal execution.
 *
 * Conceptual Placeholders for constructor arguments (to be supplied by backend/UI):
 * %%GOVERNOR_NAME%%
 * %%VOTING_TOKEN_ADDRESS%% (must be ERC20Votes compatible)
 * %%TIMELOCK_CONTROLLER_ADDRESS%%
 * %%INITIAL_VOTING_DELAY%% (blocks)
 * %%INITIAL_VOTING_PERIOD%% (blocks)
 * %%INITIAL_PROPOSAL_THRESHOLD%% (tokens needed to propose)
 * %%INITIAL_QUORUM_NUMERATOR%% (e.g., 4 for 4% quorum)
 */
contract MyGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple, // For For/Against/Abstain counting
    GovernorVotes,          // Integrates with ERC20Votes token
    GovernorVotesQuorumFraction, // Percentage-based quorum
    GovernorTimelockControl // Integrates with TimelockController
{
    /**
     * @param name_ Name of the Governor instance.
     * @param token_ Address of the ERC20Votes compatible governance token.
     * @param timelock_ Address of the TimelockController contract.
     * @param initialVotingDelay_ Initial voting delay (in blocks).
     * @param initialVotingPeriod_ Initial voting period (in blocks).
     * @param initialProposalThreshold_ Minimum voting power required to create a proposal.
     * @param initialQuorumNumerator_ Numerator for the quorum percentage (e.g., 4 for 4%). Denominator is 100.
     */
    constructor(
        string memory name_,
        IVotes token_, // IVotes is the interface for ERC20Votes compatibility
        TimelockController timelock_,
        uint256 initialVotingDelay_,
        uint256 initialVotingPeriod_,
        uint256 initialProposalThreshold_,
        uint256 initialQuorumNumerator_
    )
        Governor(name_)
        GovernorSettings(initialVotingDelay_, initialVotingPeriod_, initialProposalThreshold_)
        GovernorVotes(token_)
        GovernorVotesQuorumFraction(initialQuorumNumerator_)
        GovernorTimelockControl(timelock_)
    {
        // Further custom setup for the owner can be done here if needed,
        // e.g., granting specific roles if this contract itself isn't the Timelock admin.
        // However, GovernorTimelockControl typically makes the Governor the proposer and executor on Timelock.
    }

    // --- Required Overrides ---

    // The following functions are overrides required by Solidity.

    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function proposalThreshold()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function quorumNumerator()
        public
        view
        override(GovernorVotesQuorumFraction) // From OZ 5.x, was IGovernor prior
        returns (uint256)
    {
        return super.quorumNumerator();
    }
    
    // @inheritdoc IGovernor
    // function quorum(uint256 blockNumber) public view override(IGovernor, GovernorVotesQuorumFraction) returns (uint256) {
    //    return super.quorum(blockNumber);
    // }
    // Note: OpenZeppelin 5.x recommends overriding quorumNumerator() instead of quorum(blockNumber)
    // for GovernorVotesQuorumFraction. If using OZ 4.x, you'd override quorum(blockNumber).

    // The following functions are called by the TimelockController.
    // Ensure the Governor is granted the Proposer and Executor roles on the Timelock.
    // The Canceller role can also be granted to the Governor or another address.

    function state(uint256 proposalId)
        public
        view
        override(IGovernor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    // function _execute(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
    //     internal
    //     override(Governor, GovernorTimelockControl)
    // {
    //     super._execute(proposalId, targets, values, calldatas, descriptionHash);
    // }
    // Note: _execute is only needed if you want to add custom logic *during* execution by the Timelock.
    // Usually, you define what to execute when creating the proposal, and GovernorTimelockControl handles it.

    // function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
    //     internal
    //     override(Governor, GovernorTimelockControl)
    //     returns (uint256)
    // {
    //     return super._cancel(targets, values, calldatas, descriptionHash);
    // }
    // Note: _cancel is for cancelling proposals that are in the Timelock.

    // function _executor()
    //     internal
    //     view
    //     override(Governor, GovernorTimelockControl)
    //     returns (address)
    // {
    //     return super._executor();
    // }
    // Note: _executor typically returns address(this) for GovernorTimelockControl.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // --- Proposal Creation ---
    // Expose the propose function from Governor.sol
    // The `propose` function is public in OZ Governor.
    // function propose(
    //     address[] memory targets,
    //     uint256[] memory values,
    //     bytes[] memory calldatas,
    //     string memory description
    // ) public override(Governor) returns (uint256 proposalId) {
    //     return super.propose(targets, values, calldatas, description);
    // }
    // No need to override `propose` unless adding custom logic before or after.

    // --- Other custom functions for your DAO can be added below ---
}
