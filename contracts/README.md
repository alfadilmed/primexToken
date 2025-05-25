# Primex Smart Contracts

This directory contains Solidity smart contract templates provided by the Primex platform. Users can select these templates, customize them with their own parameters through the Smart Contract Generator, and then deploy them to an EVM-compatible blockchain.

## Solidity Version

All smart contracts in this directory are written for **Solidity version `^0.8.0`**.

## Available Templates

Currently, the following templates are available:

*   **`ERC20Template.sol`**:
    *   **Purpose:** A standard fungible token.
    *   **Customizable Parameters (via placeholders `%%...%%`):**
        *   `%%TOKEN_NAME%%`: The name of the token (e.g., "My Token").
        *   `%%TOKEN_SYMBOL%%`: The symbol of the token (e.g., "MTK").
        *   `%%INITIAL_SUPPLY%%`: The total number of tokens to be minted to the deployer upon contract creation (not in wei, will be multiplied by 10^decimals).
    *   **Note:** This is a basic implementation. For production deployments with significant value, consider using or referencing OpenZeppelin's robust ERC20 contract.

*   **`NFTCollectionTemplate.sol`**:
    *   **Purpose:** A standard non-fungible token (NFT) collection, based on ERC721.
    *   **Customizable Parameters (via placeholders `%%...%%`):**
        *   `%%COLLECTION_NAME%%`: The name of the NFT collection (e.g., "My Awesome NFTs").
        *   `%%COLLECTION_SYMBOL%%`: The symbol for the NFT collection (e.g., "MANFT").
    *   **Features:** Minting is restricted to the contract owner (deployer). Includes basic transfer and approval functions.
    *   **Note:** This is a basic ERC721 implementation. For production, consider OpenZeppelin's ERC721 contract.

*   **`CrowdfundingTemplate.sol`**:
    *   **Purpose:** A template for a crowdfunding or Initial Coin Offering (ICO) contract where users can contribute funds to a project.
    *   **Customizable Parameters (constructor arguments, filled by backend before compilation):**
        *   `beneficiary`: The address that will receive the raised funds.
        *   `fundingGoal`: The target amount of funds to be raised.
        *   `duration`: The duration of the crowdfunding campaign (in seconds).
        *   *(Potentially others like token being sold, rate, etc. The current template is a basic placeholder).*
    *   **Note:** The current template is very basic and much of the core logic is placeholder. It requires significant development to be a fully functional and secure crowdfunding contract.

*   **`VotingTemplate.sol`**:
    *   **Purpose:** A template for a simple on-chain voting system.
    *   **Customizable Parameters (constructor arguments/setup functions, filled by backend):**
        *   *(Proposals, voting duration, etc. would be configured by the user through the platform).*
    *   **Note:** The current template is a minimal skeleton and needs substantial development for a complete voting solution.

## Placeholder System

The `.sol` files use a placeholder system with values formatted as `%%PLACEHOLDER_NAME%%`. These placeholders are replaced by user-provided values when a contract is generated using the "SmartContractGenerator" feature on the Primex platform. The backend service handles this replacement and then compiles the resulting Solidity code.

## Compilation

The compilation of these templates (after placeholder replacement) is handled by a backend service that uses `solc-js`. Users receive the ABI and bytecode, which they can then deploy using the "Deploy" feature of the platform.

## Testing

(This section should be updated once a testing framework like Hardhat or Truffle is fully integrated for these contracts.)

To run tests for these contracts (once set up):
```bash
# Example with Hardhat (assuming Hardhat is set up in a dedicated directory or the backend)
# npx hardhat test
```
Currently, tests for these specific contracts are being developed as part of the backend testing strategy for the compilation service. Dedicated contract unit tests using a framework like Hardhat are recommended for future development.
