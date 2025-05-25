// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
// import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // Keep for potential ERC20 variant
import "@openzeppelin/contracts/utils/math/SafeMath.sol"; // Still using for explicit safety, though 0.8+ helps

/**
 * @title CrowdfundingTemplate
 * @dev A template for a crowdfunding contract.
 * Allows users to contribute ETH towards a funding goal.
 * Includes features like goal, deadline, owner withdrawals, and contributor refunds.
 */
contract CrowdfundingTemplate is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    // --- State Variables ---

    address public immutable beneficiary;
    uint256 public immutable fundingGoal; // In wei
    uint256 public immutable deadline;    // Unix timestamp

    mapping(address => uint256) public contributions;
    uint256 public amountRaised;

    bool public fundingGoalReached = false;
    bool public crowdfundingEnded = false; // Manually or by deadline + goal conditions met

    // --- Events ---

    event Contribution(address indexed contributor, uint256 amount);
    event Withdrawal(address indexed beneficiary, uint256 amount);
    event Refund(address indexed contributor, uint256 amount);
    event CrowdfundingCampaignEnded(uint256 totalRaised, bool goalReached);

    // --- Modifiers ---
    
    modifier afterDeadline() {
        require(block.timestamp >= deadline, "Crowdfunding: Campaign still active");
        _;
    }
    
    modifier beforeDeadline() {
        require(block.timestamp < deadline, "Crowdfunding: Campaign has ended (deadline passed)");
        _;
    }

    modifier campaignActive() {
        require(!crowdfundingEnded, "Crowdfunding: Campaign has been manually ended");
        _;
    }


    // --- Constructor ---
    constructor(
        address beneficiary_,
        uint256 fundingGoal_, // Expect in wei
        uint256 durationSeconds_,
        address initialOwner
    ) Ownable(initialOwner) {
        require(beneficiary_ != address(0), "Crowdfunding: Beneficiary cannot be zero address");
        require(fundingGoal_ > 0, "Crowdfunding: Funding goal must be greater than zero");
        require(durationSeconds_ > 0, "Crowdfunding: Duration must be greater than zero");

        beneficiary = beneficiary_;
        fundingGoal = fundingGoal_;
        deadline = block.timestamp + durationSeconds_;
    }

    // --- Functions ---

    /**
     * @dev Allows users to contribute ETH to the campaign.
     */
    function contribute() external payable nonReentrant beforeDeadline campaignActive {
        require(msg.value > 0, "Crowdfunding: Contribution must be greater than zero");

        contributions[msg.sender] = contributions[msg.sender].add(msg.value);
        amountRaised = amountRaised.add(msg.value);

        emit Contribution(msg.sender, msg.value);

        if (amountRaised >= fundingGoal) {
            fundingGoalReached = true;
            // Optional: could end campaign here if desired:
            // crowdfundingEnded = true;
            // emit CrowdfundingCampaignEnded(amountRaised, fundingGoalReached);
        }
    }

    /**
     * @dev Allows the beneficiary (via contract owner) to withdraw funds.
     * Conditions: Goal must be reached AND (deadline passed OR campaign manually ended).
     */
    function withdrawFunds() external onlyOwner nonReentrant {
        require(fundingGoalReached, "Crowdfunding: Funding goal not reached");
        require(block.timestamp >= deadline || crowdfundingEnded, "Crowdfunding: Campaign not yet eligible for withdrawal (deadline/end state)");
        
        uint256 amountToWithdraw = address(this).balance;
        require(amountToWithdraw > 0, "Crowdfunding: No funds to withdraw");

        // To prevent further contributions or refunds after successful withdrawal
        crowdfundingEnded = true; 

        (bool success, ) = beneficiary.call{value: amountToWithdraw}("");
        require(success, "Crowdfunding: ETH transfer to beneficiary failed");

        emit Withdrawal(beneficiary, amountToWithdraw);
        if (!crowdfundingEnded) { // If not already ended by goal or manual call
             emit CrowdfundingCampaignEnded(amountRaised, fundingGoalReached);
        }
    }

    /**
     * @dev Allows contributors to claim a refund.
     * Conditions: Deadline must have passed (or campaign manually ended) AND funding goal NOT reached.
     */
    function claimRefund() external nonReentrant {
        require(block.timestamp >= deadline || crowdfundingEnded, "Crowdfunding: Campaign not yet eligible for refunds (deadline/end state)");
        require(!fundingGoalReached, "Crowdfunding: Funding goal was reached, no refunds applicable");
        
        uint256 refundAmount = contributions[msg.sender];
        require(refundAmount > 0, "Crowdfunding: No contribution found for this address or already refunded");

        contributions[msg.sender] = 0; // Mark as refunded to prevent re-claim

        (bool success, ) = msg.sender.call{value: refundAmount}("");
        require(success, "Crowdfunding: ETH refund transfer failed");

        emit Refund(msg.sender, refundAmount);
    }
    
    /**
     * @dev Allows the owner to manually end the campaign.
     * Typically used if deadline passed and owner wants to formally close it to enable withdrawals/refunds.
     * Or could be used for emergency stop (though more logic would be needed for that).
     */
    function endCampaign() external onlyOwner campaignActive {
        // require(block.timestamp >= deadline, "Crowdfunding: Cannot end campaign before deadline"); // Optional: allow early end
        crowdfundingEnded = true;
        // Note: fundingGoalReached status is determined by contributions, not by ending the campaign.
        emit CrowdfundingCampaignEnded(amountRaised, fundingGoalReached);
    }

    // --- View Functions ---

    function getCampaignStatus() external view returns (
        uint256 _deadline,
        uint256 _currentTimestamp,
        uint256 _amountRaised,
        uint256 _fundingGoal,
        bool _goalReached,
        bool _ended
    ) {
        return (deadline, block.timestamp, amountRaised, fundingGoal, fundingGoalReached, crowdfundingEnded);
    }

    function getContributionOf(address contributor) external view returns (uint256) {
        return contributions[contributor];
    }

    // --- Receive Ether ---
    // Fallback function to accept direct ETH transfers and route them to contribute().
    receive() external payable {
        contribute();
    }
}
