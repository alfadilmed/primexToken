import { GeneratorService, PlaceholderValues, CompilationResult } from './generatorService';
import solc from 'solc';

// Mock solc to control its output for testing purposes
jest.mock('solc', () => ({
  compile: jest.fn(),
}));

describe('GeneratorService', () => {
  let generatorService: GeneratorService;
  let mockSolcCompile: jest.Mock;

  beforeEach(() => {
    generatorService = new GeneratorService();
    mockSolcCompile = solc.compile as jest.Mock;
    mockSolcCompile.mockReset(); // Reset mock before each test
  });

  describe('compile', () => {
    const templateString = "pragma solidity ^0.8.0; contract %%CONTRACT_NAME%% { string public name = "%%NAME%%"; uint256 public value = %%VALUE%%; }";
    const placeholderValues: PlaceholderValues = {
      "%%CONTRACT_NAME%%": "MyTestContract",
      "%%NAME%%": "Test Token",
      "%%VALUE%%": 12345,
    };
    const contractName = "MyTestContract";

    it('should correctly replace placeholders and compile successfully', async () => {
      const expectedProcessedCode = "pragma solidity ^0.8.0; contract MyTestContract { string public name = "Test Token"; uint256 public value = 12345; }";
      const mockAbi = [{ type: 'constructor' }];
      const mockBytecode = '0x6080...';

      mockSolcCompile.mockReturnValue(JSON.stringify({
        contracts: {
          'Contract.sol': {
            [contractName]: {
              abi: mockAbi,
              evm: { bytecode: { object: mockBytecode.substring(2) } }, // solc returns bytecode without 0x
            },
          },
        },
      }));

      const result = await generatorService.compile(templateString, placeholderValues, contractName);

      // Check if solc.compile was called with the processed code
      const compilerInput = JSON.parse(mockSolcCompile.mock.calls[0][0]);
      expect(compilerInput.sources['Contract.sol'].content).toEqual(expectedProcessedCode);
      
      expect(result.abi).toEqual(mockAbi);
      expect(result.bytecode).toEqual(mockBytecode);
    });

    it('should throw an error if solc compilation fails', async () => {
      const mockError = { severity: 'error', formattedMessage: 'Syntax error in template.' };
      mockSolcCompile.mockReturnValue(JSON.stringify({
        errors: [mockError],
      }));

      await expect(generatorService.compile(templateString, placeholderValues, contractName))
        .rejects
        .toThrow(`Solidity compilation failed:\n${mockError.formattedMessage}`);
    });

    it('should throw an error if the specified contractName is not found in compiler output', async () => {
      mockSolcCompile.mockReturnValue(JSON.stringify({
        contracts: {
          'Contract.sol': {
            'AnotherContract': { // Different contract name
              abi: [],
              evm: { bytecode: { object: '0x123' } },
            },
          },
        },
      }));
      
      const wrongContractName = "NonExistentContract";
      await expect(generatorService.compile(templateString, placeholderValues, wrongContractName))
        .rejects
        .toThrow(`Contract with name '${wrongContractName}' not found in compiled output. Available contracts from compilation: AnotherContract. Ensure the 'contractName' parameter matches a contract in your template.`);
    });
    
    it('should throw an error if ABI is missing from compiler output', async () => {
        mockSolcCompile.mockReturnValue(JSON.stringify({
            contracts: {
                'Contract.sol': {
                    [contractName]: { // Correct contract name
                        // ABI is missing
                        evm: { bytecode: { object: '0x123' } },
                    },
                },
            },
        }));

        await expect(generatorService.compile(templateString, placeholderValues, contractName))
            .rejects
            .toThrow(`ABI not found for contract '${contractName}'.`);
    });

    it('should throw an error if bytecode is missing from compiler output', async () => {
        mockSolcCompile.mockReturnValue(JSON.stringify({
            contracts: {
                'Contract.sol': {
                    [contractName]: { // Correct contract name
                        abi: [{ type: 'constructor' }],
                        evm: { bytecode: { /* object is missing */ } }, 
                    },
                },
            },
        }));

        await expect(generatorService.compile(templateString, placeholderValues, contractName))
            .rejects
            .toThrow(`Bytecode not found for contract '${contractName}'.`);
    });

    // Test for placeholder replacement robustness (e.g. special characters in placeholder keys or values)
    it('should correctly replace placeholders with special characters in keys', async () => {
        const templateWithSpecialKey = "contract %%CONTRACT-NAME%% { string public name = "%%NAME%%"; }";
        const placeholdersWithSpecialKey: PlaceholderValues = {
            "%%CONTRACT-NAME%%": "MySpecialContract", // Placeholder key with hyphen
            "%%NAME%%": "Special Name",
        };
        const specialContractName = "MySpecialContract";
        const expectedProcessedCode = "contract MySpecialContract { string public name = "Special Name"; }";
        
        mockSolcCompile.mockReturnValue(JSON.stringify({
            contracts: {
                'Contract.sol': {
                    [specialContractName]: {
                        abi: [],
                        evm: { bytecode: { object: '0x' } },
                    },
                },
            },
        }));

        await generatorService.compile(templateWithSpecialKey, placeholdersWithSpecialKey, specialContractName);
        const compilerInput = JSON.parse(mockSolcCompile.mock.calls[0][0]);
        expect(compilerInput.sources['Contract.sol'].content).toEqual(expectedProcessedCode);
    });

    it('should compile refactored ERC20Template (OpenZeppelin based) successfully', async () => {
      const erc20OZTemplateString = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract ERC20Template is ERC20 {
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply_
    ) ERC20(name_, symbol_) {
        _mint(msg.sender, initialSupply_ * (10**decimals()));
    }
}`;
      const placeholderValuesForOZ: PlaceholderValues = {}; // No old-style placeholders for constructor args
      const ozContractName = "ERC20Template";
      const mockAbi = [{ type: 'constructor', inputs: [{type: 'string'}, {type: 'string'}, {type: 'uint256'}] }];
      const mockBytecode = '0xcafe01';

      mockSolcCompile.mockReturnValue(JSON.stringify({
        contracts: {
          'Contract.sol': {
            [ozContractName]: {
              abi: mockAbi,
              evm: { bytecode: { object: mockBytecode.substring(2) } },
            },
          },
        },
      }));

      const result = await generatorService.compile(erc20OZTemplateString, placeholderValuesForOZ, ozContractName);

      const compilerInput = JSON.parse(mockSolcCompile.mock.calls[0][0]);
      expect(compilerInput.sources['Contract.sol'].content).toEqual(erc20OZTemplateString); // Verifies no replacement on this string
      
      expect(result.abi).toEqual(mockAbi);
      expect(result.bytecode).toEqual(mockBytecode);
    });

    it('should compile refactored NFTCollectionTemplate (OpenZeppelin based) successfully', async () => {
      const nftOZTemplateString = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract NFTCollectionTemplate is ERC721, Ownable {
    uint256 private _nextTokenId;
    constructor(
        string memory name_,
        string memory symbol_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {}
    function safeMint(address to) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        return tokenId;
    }
    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }
}`;
      const placeholderValuesForOZ: PlaceholderValues = {}; // No old-style placeholders for constructor args
      const ozNftContractName = "NFTCollectionTemplate";
      const mockNftAbi = [{ type: 'constructor', inputs: [{type: 'string'}, {type: 'string'}] }, {type: 'function', name: 'safeMint'}];
      const mockNftBytecode = '0xbeef02';

      mockSolcCompile.mockReturnValue(JSON.stringify({
        contracts: {
          'Contract.sol': {
            [ozNftContractName]: {
              abi: mockNftAbi,
              evm: { bytecode: { object: mockNftBytecode.substring(2) } },
            },
          },
        },
      }));

      const result = await generatorService.compile(nftOZTemplateString, placeholderValuesForOZ, ozNftContractName);

      const compilerInput = JSON.parse(mockSolcCompile.mock.calls[0][0]);
      expect(compilerInput.sources['Contract.sol'].content).toEqual(nftOZTemplateString); // Verifies no replacement
      
      expect(result.abi).toEqual(mockNftAbi);
      expect(result.bytecode).toEqual(mockNftBytecode);
    });
  });
});
