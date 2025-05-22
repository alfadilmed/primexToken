import React, { useState } from 'react';
import { ERC20TemplateString } from '../config/solidityTemplates/ERC20Template'; // Import template
import { NFTCollectionTemplateString } from '../config/solidityTemplates/NFTCollectionTemplate'; // Import template

const SmartContractGenerator: React.FC = () => {
  // State for contract type selection
  const [selectedContractType, setSelectedContractType] = useState<string>(''); // 'ERC20' or 'NFT'

  // State for ERC20 parameters
  const [tokenName, setTokenName] = useState<string>('');
  const [tokenSymbol, setTokenSymbol] = useState<string>('');
  const [initialSupply, setInitialSupply] = useState<string>(''); // Keep as string for input, parse on use

  // State for NFT parameters
  const [collectionName, setCollectionName] = useState<string>('');
  const [collectionSymbol, setCollectionSymbol] = useState<string>('');

  // State for the generated code
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [copyButtonText, setCopyButtonText] = useState("Copy Code");

  const isGenerateDisabled = () => {
    if (!selectedContractType) return true;
    if (selectedContractType === 'ERC20') {
      return !tokenName || !tokenSymbol || !initialSupply || parseInt(initialSupply) <= 0;
    }
    if (selectedContractType === 'NFT') {
      return !collectionName || !collectionSymbol;
    }
    return true;
  };
  
  const handleGenerateCode = () => {
    let templateString = '';
    let finalCode = '';

    if (selectedContractType === 'ERC20') {
      if (!tokenName || !tokenSymbol || !initialSupply || parseInt(initialSupply) <= 0) {
        setGeneratedCode('// Please fill all ERC20 parameters with valid values.');
        return;
      }
      templateString = ERC20TemplateString;
      finalCode = templateString.replace(/%%TOKEN_NAME%%/g, tokenName);
      finalCode = finalCode.replace(/%%TOKEN_SYMBOL%%/g, tokenSymbol);
      finalCode = finalCode.replace(/%%INITIAL_SUPPLY%%/g, initialSupply.toString());
    } else if (selectedContractType === 'NFT') {
      if (!collectionName || !collectionSymbol) {
        setGeneratedCode('// Please fill all NFT parameters.');
        return;
      }
      templateString = NFTCollectionTemplateString;
      finalCode = templateString.replace(/%%COLLECTION_NAME%%/g, collectionName);
      finalCode = finalCode.replace(/%%COLLECTION_SYMBOL%%/g, collectionSymbol);
    } else {
      setGeneratedCode('// Please select a contract type.');
      return;
    }
    setGeneratedCode(finalCode.trim());
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode)
        .then(() => {
          setCopyButtonText("Copied!");
          setTimeout(() => setCopyButtonText("Copy Code"), 2000);
        })
        .catch(err => {
          console.error('Failed to copy code: ', err);
          setCopyButtonText("Copy Failed!"); // Provide feedback on error
          setTimeout(() => setCopyButtonText("Copy Code"), 2000);
        });
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-10 text-center">Smart Contract Generator</h1>

      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        {/* Contract Type Selection */}
        <div className="mb-6">
          <label htmlFor="contractType" className="block text-sm font-medium text-gray-700 mb-1">
            Select Contract Type:
          </label>
          <select
            id="contractType"
            value={selectedContractType}
            onChange={(e) => setSelectedContractType(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
          >
            <option value="">-- Select Type --</option>
            <option value="ERC20">ERC-20 Token</option>
            <option value="NFT">NFT Collection (ERC-721)</option>
          </select>
        </div>

        {/* ERC20 Parameters Form */}
        {selectedContractType === 'ERC20' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="tokenName" className="block text-sm font-medium text-gray-700">Token Name (e.g., MyToken)</label>
              <input type="text" id="tokenName" value={tokenName} onChange={(e) => setTokenName(e.target.value)} required 
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="tokenSymbol" className="block text-sm font-medium text-gray-700">Token Symbol (e.g., MYT)</label>
              <input type="text" id="tokenSymbol" value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value)} required
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="initialSupply" className="block text-sm font-medium text-gray-700">Initial Supply (e.g., 1000000)</label>
              <input type="number" id="initialSupply" value={initialSupply} onChange={(e) => setInitialSupply(e.target.value)} required min="1"
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
          </div>
        )}

        {/* NFT Parameters Form */}
        {selectedContractType === 'NFT' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="collectionName" className="block text-sm font-medium text-gray-700">Collection Name (e.g., My Cool NFTs)</label>
              <input type="text" id="collectionName" value={collectionName} onChange={(e) => setCollectionName(e.target.value)} required
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="collectionSymbol" className="block text-sm font-medium text-gray-700">Collection Symbol (e.g., MCN)</label>
              <input type="text" id="collectionSymbol" value={collectionSymbol} onChange={(e) => setCollectionSymbol(e.target.value)} required
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
          </div>
        )}

        {selectedContractType && (
          <div className="mt-8">
            <button
              onClick={handleGenerateCode}
              disabled={isGenerateDisabled()}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Generate Code
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-10 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Generated Solidity Code</h2>
        <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto min-h-[200px]">
          <code>
            {generatedCode || "// Code will appear here..."}
          </code>
        </pre>
        {generatedCode && generatedCode !== '// Please select a contract type.' && !generatedCode.startsWith('// Please fill all') && (
          <button
            onClick={handleCopyCode}
            className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 sm:w-auto"
          >
            {copyButtonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default SmartContractGenerator;
