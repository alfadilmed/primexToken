import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router, useLocation, useNavigate } from 'react-router-dom';
import SmartContractGenerator from './SmartContractGenerator'; // Adjust path
import { AuthContext, AuthContextType } from '../contexts/AuthContext'; // Adjust path
import { Web3Context, Web3ContextType } from '../contexts/Web3Context'; // Adjust path
import axios from 'axios';
import { ERC20TemplateString } from '../config/solidityTemplates/ERC20Template'; // Example template string

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
const mockLocationState = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: mockLocationState() }), // Allow mocking of location.state
}));

// Default mock for useAuth
const defaultAuthContextValue: AuthContextType = {
  user: { id: 'testUser', username: 'test', email: 'test@test.com', walletAddress: '0x123' },
  token: 'testToken', // Needed for API calls if auth is required
  isLoading: false, error: null, login: jest.fn(), register: jest.fn(),
  logout: jest.fn(), clearError: jest.fn(),
};

// Default mock for useWeb3
const defaultWeb3ContextValue: Web3ContextType = {
  ethersProvider: null, signer: null, account: null, chainId: null, networkName: null,
  connectWallet: jest.fn(), disconnectWallet: jest.fn(), isLoading: false,
};

const renderGeneratorPage = (
  authContext: AuthContextType = defaultAuthContextValue,
  web3Context: Web3ContextType = defaultWeb3ContextValue,
  locationState?: any // To simulate receiving template data via navigation state
) => {
  mockLocationState.mockReturnValue(locationState); // Set the mock return value for useLocation().state
  return render(
    <Router>
      <AuthContext.Provider value={authContext}>
        <Web3Context.Provider value={web3Context}>
          <SmartContractGenerator />
        </Web3Context.Provider>
      </AuthContext.Provider>
    </Router>
  );
};

// Example template data that might be passed via location state
const erc20TemplateData = {
  _id: '1',
  name: 'ERC20 Standard',
  description: 'A standard ERC20 token.',
  templateString: ERC20TemplateString, // Actual Solidity template string
  placeholders: ['%%TOKEN_NAME%%', '%%TOKEN_SYMBOL%%', '%%INITIAL_SUPPLY%%'], // Conceptual
  contractName: 'ERC20Template' // Name of the contract within the templateString
};


describe('SmartContractGenerator Page', () => {
  beforeEach(() => {
    mockedAxios.post.mockReset();
    mockNavigate.mockClear();
    mockLocationState.mockReset();
  });

  test('renders a message if no template is selected/passed via state', () => {
    renderGeneratorPage(defaultAuthContextValue, defaultWeb3ContextValue, null); // No location state
    expect(screen.getByText(/no template selected/i)).toBeInTheDocument();
    // Or, if it redirects, check mockNavigate
    // expect(mockNavigate).toHaveBeenCalledWith('/templates'); // Example redirect
  });

  test('renders form fields based on a selected ERC20 template', () => {
    renderGeneratorPage(defaultAuthContextValue, defaultWeb3ContextValue, { template: erc20TemplateData });
    expect(screen.getByRole('heading', { name: new RegExp(erc20TemplateData.name, "i") })).toBeInTheDocument();
    // Assuming placeholders are used to generate form fields
    // These labels might come from a more structured placeholder definition in templateData
    expect(screen.getByLabelText(/token name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/token symbol/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/initial supply/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate contract/i })).toBeInTheDocument();
  });

  test('allows input into form fields for ERC20 template', () => {
    renderGeneratorPage(defaultAuthContextValue, defaultWeb3ContextValue, { template: erc20TemplateData });
    fireEvent.change(screen.getByLabelText(/token name/i), { target: { value: 'MyGoldCoin' } });
    fireEvent.change(screen.getByLabelText(/token symbol/i), { target: { value: 'MGC' } });
    fireEvent.change(screen.getByLabelText(/initial supply/i), { target: { value: '1000000' } });

    expect((screen.getByLabelText(/token name/i) as HTMLInputElement).value).toBe('MyGoldCoin');
    expect((screen.getByLabelText(/token symbol/i) as HTMLInputElement).value).toBe('MGC');
    expect((screen.getByLabelText(/initial supply/i) as HTMLInputElement).value).toBe('1000000');
  });

  test('submits data to compile API and navigates to deploy page on success', async () => {
    const mockAbi = [{ type: 'function', name: 'balanceOf' }];
    const mockBytecode = '0x6080...';
    mockedAxios.post.mockResolvedValue({ data: { abi: mockAbi, bytecode: mockBytecode } });
    
    renderGeneratorPage(defaultAuthContextValue, defaultWeb3ContextValue, { template: erc20TemplateData });

    fireEvent.change(screen.getByLabelText(/token name/i), { target: { value: 'MyGoldCoin' } });
    fireEvent.change(screen.getByLabelText(/token symbol/i), { target: { value: 'MGC' } });
    fireEvent.change(screen.getByLabelText(/initial supply/i), { target: { value: '1000000' } });
    fireEvent.click(screen.getByRole('button', { name: /generate contract/i }));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/generator/compile-template', {
        templateString: erc20TemplateData.templateString,
        placeholderValues: {
          '%%TOKEN_NAME%%': 'MyGoldCoin',
          '%%TOKEN_SYMBOL%%': 'MGC',
          '%%INITIAL_SUPPLY%%': 1000000, // Ensure this is number if service expects number
        },
        contractName: erc20TemplateData.contractName,
      });
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/deploy', {
      state: {
        abi: mockAbi,
        bytecode: mockBytecode,
        contractName: 'MyGoldCoin', // Or derived from template/user input
      },
    });
  });

  test('displays an error message if API compilation fails', async () => {
    mockedAxios.post.mockRejectedValue({ 
      response: { data: { message: 'Compilation Failed', details: 'Syntax error in Solidity.' } } 
    });
    renderGeneratorPage(defaultAuthContextValue, defaultWeb3ContextValue, { template: erc20TemplateData });

    fireEvent.change(screen.getByLabelText(/token name/i), { target: { value: 'BadToken' } });
    // ... fill other fields ...
    fireEvent.click(screen.getByRole('button', { name: /generate contract/i }));

    await waitFor(() => {
      // Assuming an error message area/component gets populated
      expect(screen.getByText(/compilation failed/i)).toBeInTheDocument();
      expect(screen.getByText(/syntax error in solidity/i)).toBeInTheDocument();
    });
  });
  
  test('displays loading state during compilation', () => {
    mockedAxios.post.mockImplementation(() => new Promise(() => {})); // Never resolves
    renderGeneratorPage(defaultAuthContextValue, defaultWeb3ContextValue, { template: erc20TemplateData });

    fireEvent.click(screen.getByRole('button', { name: /generate contract/i }));
    // Assuming a loading indicator is shown, e.g., the button text changes or a spinner appears
    expect(screen.getByRole('button', { name: /generating.../i })).toBeInTheDocument();
  });
});
