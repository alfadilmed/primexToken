// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/finance/VestingWallet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VestingWalletTemplate
 * @dev This contract creates a VestingWallet for a beneficiary, allowing ETH to be vested over time.
 * It inherits from OpenZeppelin's VestingWallet and makes it Ownable by a specified admin/owner.
 * The initialOwner is responsible for funding the wallet with ETH.
 * The beneficiary can then release vested funds.
 *
 * Placeholders to be replaced by backend or UI for constructor arguments:
 * %%BENEFICIARY_ADDRESS%%
 * %%START_TIMESTAMP%% (Unix timestamp for when vesting begins)
 * %%DURATION_SECONDS%% (Total duration of the vesting period in seconds)
 * %%INITIAL_OWNER_ADDRESS%% (Address that will own this VestingWallet contract instance)
 */
contract VestingWalletTemplate is VestingWallet, Ownable {
    /**
     * @dev Sets up the VestingWallet.
     * @param beneficiaryAddress The address that will receive vested ETH.
     * @param startTimestamp The Unix timestamp when vesting should begin.
     * @param durationSeconds The total duration of the vesting period in seconds.
     * @param initialOwner The address that will be the owner of this VestingWallet instance.
     *                     This owner can, for example, transfer ownership if needed, but cannot
     *                     typically interfere with the vesting schedule of a non-revocable VestingWallet.
     */
    constructor(
        address beneficiaryAddress,
        uint64 startTimestamp, // Changed from uint256 to uint64 to match OZ VestingWallet
        uint64 durationSeconds, // Changed from uint256 to uint64
        address initialOwner
    ) VestingWallet(beneficiaryAddress, startTimestamp, durationSeconds) Ownable(initialOwner) {
        // VestingWallet constructor handles setting beneficiary, start, and duration.
        // Ownable constructor sets the initialOwner.
    }

    /**
     * @dev Allows the owner to deposit ETH into the VestingWallet.
     * This is not strictly necessary as ETH can be sent directly to the contract address,
     * but having an explicit function can be clearer for some users/scripts.
     * The actual vesting logic relies on the balance of this contract.
     */
    function depositETH() external payable onlyOwner {
        // ETH is automatically added to the contract's balance by the payable keyword.
        // No further logic needed here unless emitting an event.
    }

    /**
     * @dev Releases the ETH vested at the current time for the beneficiary.
     * This function is inherited from VestingWallet and can be called by anyone
     * (typically the beneficiary or an automated script), and funds are sent to the beneficiary.
     * function release() external;
     */

    /**
     * @dev Releases the vested amount of a specific ERC20 token for the beneficiary.
     * This function is inherited from VestingWallet.
     * The VestingWallet contract must hold the ERC20 tokens for this to work.
     * function release(IERC20 token) external;
     */

    /**
     * @dev Returns the amount of ETH that has already vested.
     * Inherited from VestingWallet.
     * function released() public view returns (uint256);
     */

    /**
     * @dev Returns the amount of a specific ERC20 token that has already vested.
     * Inherited from VestingWallet.
     * function released(IERC20 token) public view returns (uint256);
     */

    /**
     * @dev Calculates the amount of ETH vested at a specific timestamp.
     * Inherited from VestingWallet.
     * function vestedAmount(uint64 timestamp) public view returns (uint256);
     */
    
    /**
     * @dev Calculates the amount of a specific ERC20 token vested at a specific timestamp.
     * Inherited from VestingWallet.
     * function vestedAmount(IERC20 token, uint64 timestamp) public view returns (uint256);
     */

    // To receive ETH when sent directly to the contract address (needed for VestingWallet to work)
    receive() external payable virtual override {
        // Call VestingWallet's internal logic if it has one, or just accept ETH.
        // OpenZeppelin's VestingWallet has its own receive() external payable {}
        // By overriding, we must ensure its purpose is maintained or enhanced.
        // The default VestingWallet receive() is empty, just accepts ETH.
        // If we want to add logging or checks, we can. For a template, keeping it simple or
        // calling super.receive() if it existed and was virtual would be options.
        // Since OZ VestingWallet's receive is not virtual, we just accept ETH.
        // This is fine as the vesting logic depends on address(this).balance.
    }
}
