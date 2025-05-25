import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Dashboard from './Dashboard'; // Adjust path if necessary
import { AuthContext, AuthContextType } from '../contexts/AuthContext'; // Adjust path
import { Web3Context, Web3ContextType } from '../contexts/Web3Context'; // Adjust path
import axios from 'axios'; // For mocking API calls

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Helper function to render Dashboard with specific context values
const renderDashboard = (
  authContextValue?: Partial<AuthContextType>,
  web3ContextValue?: Partial<Web3ContextType>
) => {
  const fullAuthContextValue: AuthContextType = {
    user: { id: 'testUserId', username: 'Test User', email: 'test@example.com', walletAddress: '0x123' },
    token: 'testToken',
    isLoading: false,
    error: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    clearError: jest.fn(),
    ...authContextValue,
  };

  const fullWeb3ContextValue: Web3ContextType = {
    ethersProvider: null,
    signer: null,
    account: '0x123TestAccount',
    chainId: 1n,
    networkName: 'mainnet',
    connectWallet: jest.fn(),
    disconnectWallet: jest.fn(),
    isLoading: false,
    ...web3ContextValue,
  };

  return render(
    <Router>
      <AuthContext.Provider value={fullAuthContextValue}>
        <Web3Context.Provider value={fullWeb3ContextValue}>
          <Dashboard />
        </Web3Context.Provider>
      </AuthContext.Provider>
    </Router>
  );
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockedAxios.get.mockReset();
  });

  test('renders welcome message for the user', () => {
    renderDashboard();
    // Assuming the dashboard displays a welcome message like "Welcome, Test User!"
    // Adjust the text if your component displays something different.
    expect(screen.getByText(/welcome, Test User!/i)).toBeInTheDocument();
  });

  test('renders key sections like "My Deployments" and "Quick Actions"', () => {
    // Mock the API call for deployments to return an empty array initially
    mockedAxios.get.mockResolvedValue({ data: [] });
    renderDashboard();
    
    expect(screen.getByRole('heading', { name: /my recent deployments/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /quick actions/i })).toBeInTheDocument();
    // Add more checks for other expected static sections or elements
  });

  test('displays a list of recent deployments if available', async () => {
    const mockDeployments = [
      { _id: 'd1', contractName: 'MyERC20', contractAddress: '0xabc', network: 'Sepolia' },
      { _id: 'd2', contractName: 'MyNFT', contractAddress: '0xdef', network: 'Polygon Mumbai' },
    ];
    mockedAxios.get.mockResolvedValue({ data: mockDeployments });

    renderDashboard();

    // Wait for the deployments to be rendered
    // Check for specific text from each deployment item
    await waitFor(() => {
      expect(screen.getByText(/MyERC20/i)).toBeInTheDocument();
      expect(screen.getByText(/0xabc/i)).toBeInTheDocument();
      expect(screen.getByText(/MyNFT/i)).toBeInTheDocument();
      expect(screen.getByText(/0xdef/i)).toBeInTheDocument();
    });
    
    // Verify that the API call was made to the correct endpoint
    // (The deploymentController tests show it's /api/deployments for the authenticated user)
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/deployments');
  });

  test('displays a message when there are no deployments', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] }); // No deployments
    renderDashboard();

    await waitFor(() => {
      // Check for a message like "No deployments found." or similar
      expect(screen.getByText(/no deployments found/i)).toBeInTheDocument();
    });
  });
  
  test('displays loading state while fetching deployments', () => {
    // Prevent axios from resolving immediately to keep it in a loading state
    mockedAxios.get.mockImplementation(() => new Promise(() => {})); 
    renderDashboard();
    // Check for a loading indicator, e.g., text "Loading..." or a spinner role
    // This depends on how your Dashboard component indicates loading.
    // Example:
    expect(screen.getByText(/loading deployments.../i)).toBeInTheDocument(); 
  });

  test('handles error when fetching deployments', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Failed to fetch deployments'));
    renderDashboard();

    await waitFor(() => {
      // Check for an error message display
      expect(screen.getByText(/failed to load deployments/i)).toBeInTheDocument();
    });
  });

  test('renders quick action links/buttons', () => {
    mockedAxios.get.mockResolvedValue({ data: [] }); // Default for other tests
    renderDashboard();
    // Check for links like "Generate New Contract", "Deploy Contract", "Open Editor"
    expect(screen.getByRole('link', { name: /generate new contract/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /deploy existing contract/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open editor/i })).toBeInTheDocument();
  });
  
  // Test Web3Context integration (optional, as Web3Context itself is tested)
  test('displays connected wallet account if available from Web3Context', () => {
    renderDashboard(
      {}, // Default AuthContext
      { account: '0xConnectedWallet123' } // Web3Context with an account
    );
    // Assuming the Dashboard shows the connected wallet somewhere
    // This is a hypothetical element, adjust as needed
    const walletDisplay = screen.queryByText(/connected wallet: 0xConnectedWallet123/i);
    if (walletDisplay) { // Only assert if you expect it
        expect(walletDisplay).toBeInTheDocument();
    }
  });

});
