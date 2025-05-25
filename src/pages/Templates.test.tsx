import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import Templates from './Templates'; // Adjust path if necessary
import axios from 'axios'; // For mocking API calls
// import { AuthContext } from '../contexts/AuthContext'; // If needed for any reason

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // use actual for all non-hook parts
  useNavigate: () => mockNavigate,
}));

// If Templates.tsx uses AuthContext, provide a mock wrapper.
// For now, assuming it's not strictly needed for basic rendering and template listing.
// const renderTemplatesPage = (authContextValue = {}) => {
//   // ... AuthContext provider wrapping ...
//   return render(<Router><Templates /></Router>);
// };

describe('Templates Page', () => {
  const mockTemplatesData = [
    { _id: '1', name: 'ERC20 Gold', description: 'A standard ERC20 token.', category: 'Token' },
    { _id: '2', name: 'NFT Basic Collection', description: 'A basic NFT collection.', category: 'NFT' },
    { _id: '3', name: 'Simple Voting', description: 'A simple on-chain voting contract.', category: 'Governance' },
  ];

  beforeEach(() => {
    mockedAxios.get.mockReset();
    mockNavigate.mockClear();
  });

  test('renders the main heading for the templates page', () => {
    mockedAxios.get.mockResolvedValue({ data: [] }); // Return empty for this test
    render(<Router><Templates /></Router>);
    expect(screen.getByRole('heading', { name: /available smart contract templates/i })).toBeInTheDocument();
  });

  test('displays a list of templates fetched from the API', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockTemplatesData });
    render(<Router><Templates /></Router>);

    await waitFor(() => {
      // Check that each template name is rendered
      mockTemplatesData.forEach(template => {
        expect(screen.getByText(template.name)).toBeInTheDocument();
        // Optionally, check for description or category as well
        expect(screen.getByText(template.description)).toBeInTheDocument();
      });
    });
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/templates'); // Verify API endpoint
  });

  test('displays a message when no templates are available', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    render(<Router><Templates /></Router>);

    await waitFor(() => {
      expect(screen.getByText(/no templates available at the moment/i)).toBeInTheDocument();
    });
  });
  
  test('displays loading state while fetching templates', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<Router><Templates /></Router>);
    // Assuming a loading message or spinner is shown
    expect(screen.getByText(/loading templates.../i)).toBeInTheDocument(); 
  });

  test('handles error when fetching templates', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Failed to fetch'));
    render(<Router><Templates /></Router>);

    await waitFor(() => {
      expect(screen.getByText(/failed to load templates/i)).toBeInTheDocument();
    });
  });

  test('clicking on a template card navigates to the generator with template ID or data', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockTemplatesData });
    render(<Router><Templates /></Router>);

    await waitFor(() => { // Ensure templates are loaded
      expect(screen.getByText(mockTemplatesData[0].name)).toBeInTheDocument();
    });

    // Assuming each template is rendered in a clickable element (e.g., a div with role 'button' or a specific testid)
    // Let's assume the template name itself is clickable or part of a larger clickable card.
    // This selector might need to be more specific based on actual DOM structure.
    const firstTemplateCard = screen.getByText(mockTemplatesData[0].name).closest('div'); // Example: find closest div
    if (!firstTemplateCard) throw new Error("Could not find template card for interaction test.");
    
    fireEvent.click(firstTemplateCard);

    // Check if navigate was called, e.g., to the generator page with template data
    // The exact navigation path and state depends on implementation
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/generator'), // Or specific path
      expect.objectContaining({ // Optional: if state is passed via navigate
        state: expect.objectContaining({ template: mockTemplatesData[0] }) 
      })
    );
    // Or if it navigates with an ID:
    // expect(mockNavigate).toHaveBeenCalledWith(`/generator/${mockTemplatesData[0]._id}`);
  });
});
