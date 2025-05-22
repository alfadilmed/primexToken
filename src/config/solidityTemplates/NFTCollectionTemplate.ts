export const NFTCollectionTemplateString = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// A very basic ERC721 implementation for demonstration.
// For production, consider OpenZeppelin's ERC721.
contract NFTCollectionTemplate {
    string public constant name = "%%COLLECTION_NAME%%";
    string public constant symbol = "%%COLLECTION_SYMBOL%%";

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    uint256 private _nextTokenId;
    address public owner; // For ownable minting

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _balances[to]++;
        _owners[tokenId] = to;
        emit Transfer(address(0), to, tokenId);
    }
    
    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "ERC721: owner query for nonexistent token");
        return tokenOwner;
    }

    function balanceOf(address account) public view returns (uint256) {
        require(account != address(0), "ERC721: balance query for the zero address");
        return _balances[account];
    }
    
    function approve(address to, uint256 tokenId) public {
        address tokenOwner = ownerOf(tokenId);
        require(to != tokenOwner, "ERC721: approval to current owner");
        require(msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender), "ERC721: approve caller is not owner nor approved for all");
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        require(_owners[tokenId] != address(0), "ERC721: approved query for nonexistent token");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) public {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address account, address operator) public view returns (bool) {
        return _operatorApprovals[account][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        require(ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to the zero address");
        
        address approvedAddress = getApproved(tokenId);
        require(msg.sender == from || msg.sender == approvedAddress || isApprovedForAll(from, msg.sender), "ERC721: transfer caller is not owner nor approved");

        _balances[from]--;
        _balances[to]++;
        _owners[tokenId] = to;
        delete _tokenApprovals[tokenId]; // Clear previous approvals
        emit Transfer(from, to, tokenId);
    }
    
    // Basic support for enumeration (optional for MVP but good to have a placeholder)
    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    function tokenByIndex(uint256 index) public view returns (uint256) {
        require(index < _nextTokenId, "ERC721Enumerable: global index out of bounds");
        return index; // This is a simplification; real enumeration is more complex
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256) {
        // This is a simplification; real enumeration by owner is more complex
        require(index < balanceOf(owner), "ERC721Enumerable: owner index out of bounds");
        uint256 count = 0;
        for (uint256 i = 0; i < _nextTokenId; i++) {
            if (ownerOf(i) == owner) {
                if (count == index) {
                    return i;
                }
                count++;
            }
        }
        revert("ERC721Enumerable: owner index out of bounds");
    }
}
`;
