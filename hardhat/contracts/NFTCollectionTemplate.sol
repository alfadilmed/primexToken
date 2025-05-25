// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; // For restricting minting

/**
 * @title NFTCollectionTemplate
 * @dev A basic ERC721 NFT Collection template that inherits from OpenZeppelin's ERC721 and Ownable.
 * Allows customization of name and symbol via placeholders, with minting restricted to the owner.
 */
contract NFTCollectionTemplate is ERC721, Ownable {
    // Counter for a simple sequential token ID generation.
    // OpenZeppelin's ERC721Enumerable can also provide totalSupply and tokenByIndex/tokenOfOwnerByIndex
    // but adds gas cost. For a basic template, a simple counter is often sufficient.
    // If enumeration is desired, consider importing and using ERC721Enumerable.sol.
    uint256 private _nextTokenId;

    /**
     * @dev Sets the values for {name} and {symbol} for the NFT collection.
     * Transfers ownership of the contract to the deployer.
     */
    constructor(
        string memory name_, // Corresponds to %%COLLECTION_NAME%%
        string memory symbol_ // Corresponds to %%COLLECTION_SYMBOL%%
    ) ERC721(name_, symbol_) Ownable(msg.sender) { // msg.sender is the initial owner
        // No initial NFTs are minted by default.
    }

    /**
     * @dev Mints a new NFT to the specified address.
     * Can only be called by the contract owner.
     * @param to The address to mint the NFT to.
     * @return The ID of the minted token.
     */
    function safeMint(address to) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId); // OpenZeppelin's internal minting function
        return tokenId;
    }

    /**
     * @dev Returns the total number of tokens minted so far.
     * This is a simple counter; for full ERC721 Enumerable features,
     * you would inherit from ERC721Enumerable.
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    // Note: Functions like ownerOf, balanceOf, approve, transferFrom, etc.,
    // are inherited from OpenZeppelin's ERC721 contract.
    // If specific overrides or additional view functions for metadata are needed,
    // they can be added here. For example, a baseURI for token metadata.
}
