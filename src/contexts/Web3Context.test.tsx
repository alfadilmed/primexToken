import React from 'react';
import { render, act, screen, fireEvent } from '@testing-library/react';
import { Web3Provider, useWeb3 } from './Web3Context'; // Adjust path if necessary
import { ethers } from 'ethers';

// Mock ethers.BrowserProvider and its methods
const mockGetSigner = jest.fn();
const mockGetNetwork = jest.fn();
const mockSend = jest.fn();
const mockGetAddress = jest.fn();

jest.mock('ethers', () => {
  const originalEthers = jest.requireActual('ethers');
  return {
    ...originalEthers,
    BrowserProvider: jest.fn().mockImplementation(() => ({
      getSigner: mockGetSigner,
      getNetwork: mockGetNetwork,
      send: mockSend,
    })),
  };
});

// Mock window.ethereum
const mockAddListener = jest.fn();
const mockRemoveListener = jest.fn();
(global as any).window.ethereum = {
  on: mockAddListener,
  removeListener: mockRemoveListener,
  // Add other methods if Web3Context uses them, e.g., request
};


// A simple component to consume and display context values
const TestConsumerComponent = () => {
  const { account, chainId, networkName, ethersProvider, signer, connectWallet, disconnectWallet, isLoading } = useWeb3();
  return (
    <div>
      <div data-testid="account">{account}</div>
      <div data-testid="chainId">{String(chainId)}</div>
      <div data-testid="networkName">{networkName}</div>
      <div data-testid="provider-present">{ethersProvider ? 'true' : 'false'}</div>
      <div data-testid="signer-present">{signer ? 'true' : 'false'}</div>
      <div data-testid="isLoading">{isLoading ? 'true' : 'false'}</div>
      <button onClick={connectWallet}>Connect Wallet</button>
      <button onClick={disconnectWallet}>Disconnect Wallet</button>
    </div>
  );
};

describe('Web3Context', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockGetSigner.mockReset();
    mockGetNetwork.mockReset();
    mockSend.mockReset();
    mockGetAddress.mockReset();
    mockAddListener.mockClear();
    mockRemoveListener.mockClear();
    (ethers.BrowserProvider as jest.Mock).mockClear();

    // Default mock implementations
    mockSend.mockResolvedValue(['0xTestAccount']); // For 'eth_requestAccounts'
    mockGetAddress.mockResolvedValue('0xTestAccount');
    mockGetSigner.mockResolvedValue({ getAddress: mockGetAddress });
    mockGetNetwork.mockResolvedValue({ chainId: 1n, name: 'mainnet' });
  });

  test('provides initial context values', () => {
    render(
      <Web3Provider>
        <TestConsumerComponent />
      </Web3Provider>
    );
    expect(screen.getByTestId('account').textContent).toBe('');
    expect(screen.getByTestId('chainId').textContent).toBe('null');
    expect(screen.getByTestId('networkName').textContent).toBe('');
    expect(screen.getByTestId('provider-present').textContent).toBe('false');
    expect(screen.getByTestId('signer-present').textContent).toBe('false');
    expect(screen.getByTestId('isLoading').textContent).toBe('false');
  });

  test('connectWallet successfully updates context', async () => {
    render(
      <Web3Provider>
        <TestConsumerComponent />
      </Web3Provider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Connect Wallet'));
    });
    
    expect(ethers.BrowserProvider).toHaveBeenCalledWith(window.ethereum);
    expect(mockSend).toHaveBeenCalledWith('eth_requestAccounts', []);
    expect(mockGetSigner).toHaveBeenCalled();
    expect(mockGetAddress).toHaveBeenCalled();
    expect(mockGetNetwork).toHaveBeenCalled();

    expect(screen.getByTestId('account').textContent).toBe('0xTestAccount');
    expect(screen.getByTestId('chainId').textContent).toBe('1');
    expect(screen.getByTestId('networkName').textContent).toBe('mainnet');
    expect(screen.getByTestId('provider-present').textContent).toBe('true');
    expect(screen.getByTestId('signer-present').textContent).toBe('true');
    expect(screen.getByTestId('isLoading').textContent).toBe('false'); // Should reset after loading
  });

  test('connectWallet handles no accounts found', async () => {
    mockSend.mockResolvedValueOnce([]); // Simulate no accounts returned

    render(
      <Web3Provider>
        <TestConsumerComponent />
      </Web3Provider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Connect Wallet'));
    });

    expect(screen.getByTestId('account').textContent).toBe('');
    expect(screen.getByTestId('provider-present').textContent).toBe('true'); // Provider is set
    expect(screen.getByTestId('signer-present').textContent).toBe('false'); // But signer/account are not
  });

  test('connectWallet handles error during connection', async () => {
    mockSend.mockRejectedValueOnce(new Error('Connection failed'));
    // Spy on console.error to check if it's called
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});


    render(
      <Web3Provider>
        <TestConsumerComponent />
      </Web3Provider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Connect Wallet'));
    });

    expect(screen.getByTestId('account').textContent).toBe('');
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error connecting to MetaMask:", expect.any(Error));
    consoleErrorSpy.mockRestore();
  });
  
  test('disconnectWallet clears context values', async () => {
    render(
      <Web3Provider>
        <TestConsumerComponent />
      </Web3Provider>
    );

    // First, connect
    await act(async () => {
      fireEvent.click(screen.getByText('Connect Wallet'));
    });
    expect(screen.getByTestId('account').textContent).toBe('0xTestAccount'); // Ensure connected

    // Then, disconnect
    await act(async () => {
      fireEvent.click(screen.getByText('Disconnect Wallet'));
    });

    expect(screen.getByTestId('account').textContent).toBe('');
    expect(screen.getByTestId('chainId').textContent).toBe('null');
    expect(screen.getByTestId('networkName').textContent).toBe('');
    expect(screen.getByTestId('provider-present').textContent).toBe('false');
    expect(screen.getByTestId('signer-present').textContent).toBe('false');
  });

  test('handles accountsChanged event from window.ethereum', async () => {
    render(
        <Web3Provider>
            <TestConsumerComponent />
        </Web3Provider>
    );

    // Simulate initial connection
    await act(async () => {
        fireEvent.click(screen.getByText('Connect Wallet'));
    });
    expect(screen.getByTestId('account').textContent).toBe('0xTestAccount');

    // Simulate account change event from MetaMask
    // Find the accountsChanged handler passed to window.ethereum.on
    const accountsChangedHandler = mockAddListener.mock.calls.find(call => call[0] === 'accountsChanged')?.[1];
    expect(accountsChangedHandler).toBeDefined();

    mockGetAddress.mockResolvedValueOnce('0xNewAccount'); // Next call to getAddress returns new account

    if (accountsChangedHandler) {
        await act(async () => {
            accountsChangedHandler(['0xNewAccount']); // Trigger with new account
        });
    }
    expect(screen.getByTestId('account').textContent).toBe('0xNewAccount');
  });

  test('handles chainChanged event from window.ethereum', async () => {
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...window.location, reload: mockReload },
    });

    render(
        <Web3Provider>
            <TestConsumerComponent />
        </Web3Provider>
    );

    const chainChangedHandler = mockAddListener.mock.calls.find(call => call[0] === 'chainChanged')?.[1];
    expect(chainChangedHandler).toBeDefined();

    if (chainChangedHandler) {
        await act(async () => {
            chainChangedHandler('0x2a'); // Trigger with a new chain ID
        });
    }
    expect(mockReload).toHaveBeenCalled();
    mockReload.mockRestore();
  });

});
