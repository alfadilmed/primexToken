import React from 'react';

import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import axios from 'axios'; // Import axios

const Deploy: React.FC = () => {
  const { account, networkName, chainId, connectWallet, signer } = useWeb3();

  // Form states
  const [contractName, setContractName] = useState<string>('');
  const [abi, setAbi] = useState<string>('');
  const [bytecode, setBytecode] = useState<string>('');
  const [constructorArgs, setConstructorArgs] = useState<string>('[]'); // Default to empty JSON array
  const [selectedNetwork, setSelectedNetwork] = useState<string>(''); // e.g., '80001'

  // Deployment status states
  const [deploymentStatus, setDeploymentStatus] = useState<string>('Idle');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDeploy = async () => {
    setError(null);
    setTransactionHash(null);
    setContractAddress(null);

    if (!signer || !account) {
      setError("Wallet not connected. Please connect your wallet.");
      setDeploymentStatus("Failed");
      return;
    }
    if (!abi || !bytecode) {
      setError("ABI and Bytecode are required.");
      setDeploymentStatus("Failed");
      return;
    }
    if (!selectedNetwork) {
      setError("Please select a target network.");
      setDeploymentStatus("Failed");
      return;
    }

    if (chainId?.toString() !== selectedNetwork) {
      setError(`Please switch your wallet to the selected target network (Chain ID: ${selectedNetwork}), then try again. Your current network is ${networkName} (ID: ${String(chainId)}).`);
      setDeploymentStatus("Failed");
      return;
    }

    let parsedAbi;
    try {
      parsedAbi = JSON.parse(abi);
    } catch (e) {
      setError("Invalid ABI format. Please provide a valid JSON ABI.");
      setDeploymentStatus("Failed");
      return;
    }

    let parsedConstructorArgs = [];
    if (constructorArgs.trim() !== '' && constructorArgs.trim() !== '[]') {
      try {
        parsedConstructorArgs = JSON.parse(constructorArgs);
        if (!Array.isArray(parsedConstructorArgs)) {
          setError("Constructor arguments must be a JSON array.");
          setDeploymentStatus("Failed");
          return;
        }
      } catch (e) {
        setError("Invalid Constructor Arguments format. Please provide a valid JSON array or leave as '[]'.");
        setDeploymentStatus("Failed");
        return;
      }
    }
    
    setDeploymentStatus("Deploying...");
    try {
      const factory = new ethers.ContractFactory(parsedAbi, bytecode, signer);
      
      setDeploymentStatus("Sending transaction...");
      const contract = await factory.deploy(...parsedConstructorArgs);
      
      setTransactionHash(contract.deploymentTransaction()?.hash || 'N/A'); // deploymentTransaction can be null
      setDeploymentStatus("Waiting for confirmation (1 block)...");

      const receipt = await contract.deploymentTransaction()?.wait(1); // Wait for 1 confirmation

      if (receipt && receipt.status === 1) {
        const deployedAddr = await contract.getAddress();
        setContractAddress(deployedAddr);
        setDeploymentStatus("Deployment Successful!");

        // ---- Save deployment record to backend ----
        if (receipt && receipt.hash) { // Ensure receipt and transactionHash are available
          const deploymentData = {
            contractName: contractName || 'Unnamed Contract', // Use a default if not set
            blockchain: selectedNetwork, // This is the chainId
            network: networkName || `Chain ID ${selectedNetwork}`, // Use networkName from context or derive
            contractAddress: deployedAddr,
            transactionHash: receipt.hash,
            abi: parsedAbi, // Already parsed
          };
          try {
            await axios.post('/api/deployments', deploymentData);
            console.log('Deployment record saved to backend.');
            // Optionally, add a small success notification for saving the record
          } catch (apiError) {
            console.error('Failed to save deployment record:', apiError);
            // Optionally, notify user that saving record failed but contract is deployed
          }
        }
        // ---- End save deployment record ----

      } else {
        setError("Deployment transaction failed or was reverted.");
        setDeploymentStatus("Failed");
        if (receipt) {
            console.error("Deployment failed, receipt:", receipt);
        }
      }
    } catch (e: any) {
      console.error("Deployment error:", e);
      setError(e.message || "An unexpected error occurred during deployment.");
      setDeploymentStatus("Failed");
    }
  };
  
  const isDeployDisabled = () => {
    if (!account || !abi || !bytecode || !selectedNetwork) return true;
    // Basic validation for constructorArgs if not empty
    if (constructorArgs.trim() !== '') {
      try {
        JSON.parse(constructorArgs);
      } catch (e) {
        return true; // Invalid JSON
      }
    }
    return false;
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-10 text-center">Deploy Smart Contract</h1>
      
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-xl space-y-6">
        {/* Web3 Connection Status */}
        {!account ? (
          <div className="text-center p-4 bg-yellow-50 border border-yellow-300 rounded-md">
            <p className="text-yellow-700 mb-3">Please connect your wallet to deploy contracts.</p>
            <button
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="p-3 bg-green-50 border border-green-300 rounded-md text-center">
            <p className="text-sm text-green-700">Connected Account: <span className="font-semibold">{account}</span></p>
            <p className="text-sm text-green-700">Network: <span className="font-semibold">{networkName} (ID: {String(chainId)})</span></p>
          </div>
        )}

        {/* Form Fields */}
        <div>
          <label htmlFor="contractName" className="block text-sm font-medium text-gray-700">Contract Name (for your reference)</label>
          <input type="text" id="contractName" value={contractName} onChange={(e) => setContractName(e.target.value)}
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>

        <div>
          <label htmlFor="abi" className="block text-sm font-medium text-gray-700">ABI (JSON Format)</label>
          <textarea id="abi" value={abi} onChange={(e) => setAbi(e.target.value)} rows={4} required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
          <p className="mt-1 text-xs text-gray-500">Paste the JSON ABI array here.</p>
        </div>

        <div>
          <label htmlFor="bytecode" className="block text-sm font-medium text-gray-700">Bytecode (Hex String)</label>
          <textarea id="bytecode" value={bytecode} onChange={(e) => setBytecode(e.target.value)} rows={4} required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
          <p className="mt-1 text-xs text-gray-500">Paste the 0x-prefixed hex bytecode.</p>
        </div>

        <div>
          <label htmlFor="constructorArgs" className="block text-sm font-medium text-gray-700">Constructor Arguments</label>
          <input type="text" id="constructorArgs" value={constructorArgs} onChange={(e) => setConstructorArgs(e.target.value)}
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          <p className="mt-1 text-xs text-gray-500">Enter as a JSON array, e.g. ["MyToken", 1000]. Leave as "[]" if no arguments.</p>
        </div>
        
        <div>
          <label htmlFor="targetNetwork" className="block text-sm font-medium text-gray-700">Target Network</label>
          <select id="targetNetwork" value={selectedNetwork} onChange={(e) => setSelectedNetwork(e.target.value)} required
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm">
            <option value="">-- Select Network --</option>
            <option value="80001">Polygon Mumbai (Testnet)</option>
            <option value="11155111">Sepolia (Testnet)</option>
            {/* Add other networks as needed */}
          </select>
        </div>

        {/* Deploy Button */}
        <button
          onClick={handleDeploy}
          disabled={isDeployDisabled()}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Deploy Contract
        </button>
      </div>

      <div className="mt-10 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Deployment Status</h2>
        <div className="bg-white p-6 rounded-lg shadow-md min-h-[100px]">
          <p>Status: {deploymentStatus}</p>
          {transactionHash && <p>Transaction Hash: {transactionHash}</p>}
          {contractAddress && <p>Contract Address: {contractAddress}</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Deploy;
