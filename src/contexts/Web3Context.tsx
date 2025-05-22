import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { ethers } from 'ethers';

interface Web3ContextState {
  ethersProvider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  chainId: bigint | null;
  networkName: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isLoading: boolean;
}

const Web3Context = createContext<Web3ContextState | undefined>(undefined);

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ethersProvider, setEthersProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<bigint | null>(null);
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected. Please install MetaMask!");
      return;
    }
    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      // It's recommended to request accounts first, then get signer.
      const accounts = await provider.send('eth_requestAccounts', []);
      if (accounts.length === 0) {
        console.error("No accounts found. Make sure MetaMask is unlocked and connected.");
        setIsLoading(false);
        return;
      }
      const currentSigner = await provider.getSigner();
      const currentAccount = await currentSigner.getAddress();
      const network = await provider.getNetwork();

      setEthersProvider(provider);
      setSigner(currentSigner);
      setAccount(currentAccount);
      setChainId(network.chainId);
      setNetworkName(network.name);
      
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      // Optionally, display a user-friendly error message
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setEthersProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setNetworkName(null);
    // Further cleanup or specific provider disconnection logic might be needed
    // depending on the provider, but for MetaMask, clearing state is primary.
    console.log("Wallet disconnected by clearing app state.");
  };

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // MetaMask is locked or the user has disconnected all accounts
          console.log('MetaMask accounts disconnected or locked.');
          disconnectWallet();
        } else {
          // Re-connect or update account. For simplicity, we can call connectWallet
          // which will re-fetch signer and network info.
          console.log('MetaMask account changed, reconnecting...');
          connectWallet();
        }
      };

      const handleChainChanged = (newChainId: string) => {
        // newChainId is often hex, e.g., "0x1"
        console.log('MetaMask network changed to:', newChainId);
        // Reloading the page is a simple way to handle network changes
        window.location.reload();
        // Alternatively, re-initialize: connectWallet();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Cleanup function
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  return (
    <Web3Context.Provider value={{ ethersProvider, signer, account, chainId, networkName, connectWallet, disconnectWallet, isLoading }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

// Default export for Web3Provider is not standard if you also export useWeb3.
// Usually, you'd export them as named exports.
// export default Web3Provider; // This line can be removed if using named exports for both.
