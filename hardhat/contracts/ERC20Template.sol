// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ERC20Template
 * @dev A basic ERC20 token template that inherits from OpenZeppelin's ERC20 contract.
 * Allows customization of name, symbol, and initial supply via placeholders.
 */
contract ERC20Template is ERC20 {
    /**
     * @dev Sets the values for {name} and {symbol} and mints {initialSupply_}
     * tokens to the contract deployer.
     *
     * The `initialSupply_` should be provided in whole tokens, not considering decimals.
     * For example, if you want 1,000,000 tokens and decimals is 18, pass 1000000.
     */
    constructor(
        string memory name_, // Corresponds to %%TOKEN_NAME%%
        string memory symbol_, // Corresponds to %%TOKEN_SYMBOL%%
        uint256 initialSupply_ // Corresponds to %%INITIAL_SUPPLY%% (in whole tokens)
    ) ERC20(name_, symbol_) {
        // _mint expects the amount in the smallest unit (wei for 18 decimals)
        // initialSupply_ is provided as whole tokens, so we multiply by 10**decimals()
        _mint(msg.sender, initialSupply_ * (10**decimals()));
    }
}
