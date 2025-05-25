import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './Navbar'; // Adjust path if necessary
import { AuthContext, AuthContextType } from '../../contexts/AuthContext'; // Adjust path

// Helper function to render Navbar with a specific AuthContext value
const renderNavbar = (authContextValue: Partial<AuthContextType>) => {
  // Provide default mocks for all properties of AuthContextType
  const fullAuthContextValue: AuthContextType = {
    user: null,
    token: null,
    isLoading: false,
    error: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    clearError: jest.fn(),
    ...authContextValue, // Override defaults with provided values
  };

  return render(
    <Router>
      <AuthContext.Provider value={fullAuthContextValue}>
        <Navbar />
      </AuthContext.Provider>
    </Router>
  );
};

describe('Navbar Component', () => {
  test('renders logo or brand name', () => {
    renderNavbar({}); // Default (logged out) state
    // Assuming your Navbar has a logo with alt text "Primex Logo" or brand text "Primex"
    // This selector might need adjustment based on your actual Navbar markup.
    // Using a flexible approach to find it:
    const brandElement = screen.getByText(/primex/i) || screen.getByAltText(/logo/i);
    expect(brandElement).toBeInTheDocument();
  });

  describe('When user is not authenticated', () => {
    beforeEach(() => {
      renderNavbar({ user: null, token: null });
    });

    test('renders Login link', () => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    });

    test('renders Register link', () => {
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    });

    test('does not render Dashboard link', () => {
      expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
    });

    test('does not render Templates link', () => {
      expect(screen.queryByRole('link', { name: /templates/i })).not.toBeInTheDocument();
    });
    
    test('does not render Editor link', () => {
      expect(screen.queryByRole('link', { name: /editor/i })).not.toBeInTheDocument();
    });

    test('does not render Logout button/link', () => {
      expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /logout/i })).not.toBeInTheDocument();
    });
  });

  describe('When user is authenticated', () => {
    const mockUser = { id: '1', username: 'testuser', email: 'test@example.com', walletAddress: '' };
    beforeEach(() => {
      renderNavbar({ user: mockUser, token: 'fakeToken' });
    });

    test('renders Dashboard link', () => {
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    });

    test('renders Templates link', () => {
      expect(screen.getByRole('link', { name: /templates/i })).toBeInTheDocument();
    });
    
    test('renders Smart Contract Generator link', () => {
      // Assuming this link text might be "Generator" or "Smart Contracts" etc.
      // Using a flexible selector. Adjust if needed.
      const generatorLink = screen.getByRole('link', { name: /generator|smart contract/i });
      expect(generatorLink).toBeInTheDocument();
    });
    
    test('renders Editor link', () => {
      expect(screen.getByRole('link', { name: /editor/i })).toBeInTheDocument();
    });

    test('renders user greeting or profile link (optional test)', () => {
      // This depends on your Navbar design.
      // Example: if it shows "Hello, testuser"
      // const greeting = screen.queryByText(/hello, testuser/i);
      // expect(greeting).toBeInTheDocument();
      // Or if it has a profile link:
      const profileLink = screen.queryByRole('link', { name: /profile|testuser/i });
      if (profileLink) { // Only assert if you expect it
          expect(profileLink).toBeInTheDocument();
      }
    });

    test('renders Logout button/link', () => {
      // Depending on whether logout is a button or a link
      const logoutButton = screen.queryByRole('button', { name: /logout/i });
      const logoutLink = screen.queryByRole('link', { name: /logout/i });
      expect(logoutButton || logoutLink).toBeInTheDocument();
    });

    test('does not render Login link', () => {
      expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
    });

    test('does not render Register link', () => {
      expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument();
    });
  });
});
