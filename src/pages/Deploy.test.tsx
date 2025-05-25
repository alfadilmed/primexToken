import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Deploy from './Deploy'; // Adjust path if necessary
import { Web3Context, Web3ContextType } from '../contexts/Web3Context'; // Adjust path
import { AuthContext, AuthContextType } from '../contexts/AuthContext'; // Needed if Deploy uses it, e.g. for API calls
import { ethers } from 'ethers';
import axios from 'axios';

// Mock ethers
const mockDeploy = jest.fn();
const mockGetAddress = jest.fn();
const mockDeploymentTransaction = jest.fn().mockReturnValue({
  hash: '0xTxHash',
  wait: jest.fn(),
});

jest.mock('ethers', () => {
  const originalEthers = jest.requireActual('ethers');
  return {
    ...originalEthers,
    ContractFactory: jest.fn().mockImplementation(() => ({
      deploy: mockDeploy,
      getAddress: mockGetAddress, // if used before deploy (usually not)
    })),
  };
});

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Default mock for useAuth
const defaultAuthContextValue: AuthContextType = {
  user: { id: 'testUser', username: 'test', email: 'test@test.com', walletAddress: '0x123' },
  token: 'testToken',
  isLoading: false,
  error: null,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  clearError: jest.fn(),
};

const renderDeployPage = (
  web3ContextValue?: Partial<Web3ContextType>,
  authContextValue: AuthContextType = defaultAuthContextValue
) => {
  const fullWeb3ContextValue: Web3ContextType = {
    ethersProvider: {} as ethers.BrowserProvider, // Mocked provider
    signer: { getAddress: jest.fn().mockResolvedValue('0xMockSignerAddress') } as unknown as ethers.JsonRpcSigner, // Mocked signer
    account: '0xMockSignerAddress',
    chainId: 80001n, // Polygon Mumbai, for example
    networkName: 'Polygon Mumbai',
    connectWallet: jest.fn(),
    disconnectWallet: jest.fn(),
    isLoading: false,
    ...web3ContextValue,
  };

  return render(
    <Router>
      <AuthContext.Provider value={authContextValue}>
        <Web3Context.Provider value={fullWeb3ContextValue}>
          <Deploy />
        </Web3Context.Provider>
      </AuthContext.Provider>
    </Router>
  );
};

describe('Deploy Page', () => {
  beforeEach(() => {
    mockDeploy.mockReset();
    mockGetAddress.mockReset().mockResolvedValue('0xDeployedContractAddress'); // For getAddress call after deploy
    mockDeploymentTransaction.mockReturnValue({ hash: '0xTxHash', wait: jest.fn() }); // Reset inner mocks too
    mockDeploy.mockImplementation(() => ({ // Default successful deploy
        getAddress: mockGetAddress,
        deploymentTransaction: mockDeploymentTransaction,
    }));
    mockedAxios.post.mockReset();
    (ethers.ContractFactory as jest.Mock).mockClear();
  });

  test('renders all form fields correctly', () => {
    renderDeployPage();
    expect(screen.getByLabelText(/contract name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/abi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bytecode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/constructor arguments/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/target network/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /deploy contract/i })).toBeInTheDocument();
  });

  test('validates required fields before deployment', async () => {
    renderDeployPage();
    fireEvent.click(screen.getByRole('button', { name: /deploy contract/i }));
    // Check for error messages related to ABI and Bytecode being required
    expect(await screen.findByText(/abi and bytecode are required/i)).toBeInTheDocument();
    
    fireEvent.change(screen.getByLabelText(/abi/i), { target: { value: '[{"type":"constructor"}]' } });
    fireEvent.change(screen.getByLabelText(/bytecode/i), { target: { value: '0x6080' } });
    fireEvent.click(screen.getByRole('button', { name: /deploy contract/i }));
    expect(await screen.findByText(/please select a target network/i)).toBeInTheDocument();
  });
  
  test('validates JSON format for ABI and Constructor Arguments', async () => {
    renderDeployPage();
    fireEvent.change(screen.getByLabelText(/abi/i), { target: { value: 'not-a-json' } });
    fireEvent.change(screen.getByLabelText(/bytecode/i), { target: { value: '0x6080' } });
    fireEvent.change(screen.getByLabelText(/target network/i), { target: { value: '80001' } }); // Polygon Mumbai
    fireEvent.click(screen.getByRole('button', { name: /deploy contract/i }));
    expect(await screen.findByText(/invalid abi format/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/abi/i), { target: { value: '[{"type":"constructor"}]' } });
    fireEvent.change(screen.getByLabelText(/constructor arguments/i), { target: { value: 'not-a-json-array' } });
    fireEvent.click(screen.getByRole('button', { name: /deploy contract/i }));
    expect(await screen.findByText(/invalid constructor arguments format/i)).toBeInTheDocument();
  });

  test('handles successful deployment and saves record', async () => {
    mockDeploymentTransaction.mockReturnValue({ hash: '0xTxHash', wait: jest.fn().mockResolvedValue({ status: 1, hash: '0xTxHash' }) });
    mockedAxios.post.mockResolvedValue({ data: { message: 'Deployment record saved' } });

    renderDeployPage();
    fireEvent.change(screen.getByLabelText(/contract name/i), { target: { value: 'MyContract' } });
    fireEvent.change(screen.getByLabelText(/abi/i), { target: { value: '[{"type":"constructor"}]' } });
    fireEvent.change(screen.getByLabelText(/bytecode/i), { target: { value: '0x6080' } });
    fireEvent.change(screen.getByLabelText(/constructor arguments/i), { target: { value: '[]' } });
    fireEvent.change(screen.getByLabelText(/target network/i), { target: { value: '80001' } });

    fireEvent.click(screen.getByRole('button', { name: /deploy contract/i }));

    await waitFor(() => expect(screen.getByText(/deployment successful/i)).toBeInTheDocument());
    expect(mockDeploy).toHaveBeenCalledWith(); // Add constructor args if any were parsed
    expect(mockGetAddress).toHaveBeenCalled();
    expect(screen.getByText(/contract address: 0xDeployedContractAddress/i)).toBeInTheDocument();
    expect(screen.getByText(/transaction hash: 0xTxHash/i)).toBeInTheDocument();
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/deployments', expect.objectContaining({
      contractName: 'MyContract',
      contractAddress: '0xDeployedContractAddress',
      blockchain: '80001',
    }));
  });

  test('handles deployment transaction failure (revert)', async () => {
    mockDeploymentTransaction.mockReturnValue({ hash: '0xTxHash', wait: jest.fn().mockResolvedValue({ status: 0, hash: '0xTxHash' }) }); // status 0 for failure

    renderDeployPage();
    fireEvent.change(screen.getByLabelText(/abi/i), { target: { value: '[{"type":"constructor"}]' } });
    fireEvent.change(screen.getByLabelText(/bytecode/i), { target: { value: '0x6080' } });
    fireEvent.change(screen.getByLabelText(/target network/i), { target: { value: '80001' } });
    fireEvent.click(screen.getByRole('button', { name: /deploy contract/i }));

    await waitFor(() => expect(screen.getByText(/deployment transaction failed or was reverted/i)).toBeInTheDocument());
  });
  
  test('handles error during factory.deploy() call', async () => {
    mockDeploy.mockRejectedValue(new Error('Provider error'));

    renderDeployPage();
    fireEvent.change(screen.getByLabelText(/abi/i), { target: { value: '[{"type":"constructor"}]' } });
    fireEvent.change(screen.getByLabelText(/bytecode/i), { target: { value: '0x6080' } });
    fireEvent.change(screen.getByLabelText(/target network/i), { target: { value: '80001' } });
    fireEvent.click(screen.getByRole('button', { name: /deploy contract/i }));

    await waitFor(() => expect(screen.getByText(/an unexpected error occurred during deployment/i)).toBeInTheDocument());
    expect(screen.getByText(/provider error/i)).toBeInTheDocument(); // Check if error message is displayed
  });

  test('prompts user to switch network if wallet is on a different network', async () => {
    renderDeployPage({ chainId: 31337n, networkName: 'Localhost' }); // Web3Context on a different network
    
    fireEvent.change(screen.getByLabelText(/abi/i), { target: { value: '[{"type":"constructor"}]' } });
    fireEvent.change(screen.getByLabelText(/bytecode/i), { target: { value: '0x6080' } });
    fireEvent.change(screen.getByLabelText(/target network/i), { target: { value: '80001' } }); // Deploying to Mumbai
    fireEvent.click(screen.getByRole('button', { name: /deploy contract/i }));

    expect(await screen.findByText(/please switch your wallet to the selected target network/i)).toBeInTheDocument();
    expect(screen.getByText(/your current network is Localhost \(ID: 31337\)/i)).toBeInTheDocument();
  });
});
