// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC721ATemplate
 * @dev An ERC721A NFT Collection template for gas-efficient minting.
 * Inherits from OpenZeppelin's ERC721A and Ownable.
 * Allows customization of name and symbol. Minting is restricted to the owner.
 * MAX_SUPPLY is included as an example placeholder for a common customization.
 */
contract ERC721ATemplate is ERC721A, Ownable {
    // Maximum total supply of tokens that can be minted.
    // This is an example of a common customization. If not needed, it can be removed,
    // or managed by a separate sale contract.
    uint256 public constant MAX_SUPPLY = 100; // Placeholder for max supply

    // Base URI for token metadata. Can be set by the owner.
    string private _baseTokenURI;

    /**
     * @dev Sets the values for {name} and {symbol} for the NFT collection.
     * Transfers ownership of the contract to the deployer.
     */
    constructor(
        string memory name_, // Corresponds to %%COLLECTION_NAME%%
        string memory symbol_ // Corresponds to %%COLLECTION_SYMBOL%%
    ) ERC721A(name_, symbol_) Ownable(msg.sender) {
        // %%MAX_SUPPLY%% is a compile-time constant, so it's used directly above.
        // No specific runtime action needed for MAX_SUPPLY in constructor unless for validation.
        // Example: require(MAX_SUPPLY > 0, "Max supply must be greater than zero");
        // However, such validation might be better if MAX_SUPPLY itself was a constructor arg.
        // For a template with a const placeholder, this is how it would be.
    }

    /**
     * @dev Mints `quantity` new NFTs to the specified address `to`.
     * Can only be called by the contract owner.
     * Reverts if minting would exceed MAX_SUPPLY.
     * @param to The address to mint the NFTs to.
     * @param quantity The number of NFTs to mint.
     */
    function ownerMint(address to, uint256 quantity) public onlyOwner {
        require(totalSupply() + quantity <= MAX_SUPPLY, "ERC721A: minting would exceed max supply");
        _safeMint(to, quantity);
    }

    /**
     * @dev Sets the base URI for token metadata.
     * Can only be called by the contract owner.
     * @param baseTokenURI_ The new base URI string.
     */
    function setBaseURI(string memory baseTokenURI_) public onlyOwner {
        _baseTokenURI = baseTokenURI_;
    }

    /**
     * @dev Overrides the base URI from ERC721 to use the one set by `setBaseURI`.
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    // Note: ERC721A provides efficient batch minting. Functions like ownerOf, balanceOf,
    // approve, transferFrom, etc., are inherited.
    // The `totalSupply()` is also inherited from ERC721A and accurately reflects total tokens minted.
}
