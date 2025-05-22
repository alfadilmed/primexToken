// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title NFTCollectionTemplate
 * @dev A basic template for an NFT collection (ERC721 or ERC1155).
 * Parameters like name, symbol, and base URI will be configured by the user.
 */
contract NFTCollectionTemplate {
    // Placeholder for NFT implementation
    string public name;
    string public symbol;
    string public baseURI; // For ERC721/ERC1155 metadata

    constructor(string memory _name, string memory _symbol, string memory _baseURI) {
        name = _name;
        symbol = _symbol;
        baseURI = _baseURI;
        // Actual NFT minting and setup logic would go here
    }
}
