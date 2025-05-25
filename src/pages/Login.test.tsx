import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom'; // Needed if Login.tsx uses Link or other router features
import Login from './Login'; // Adjust path if necessary
// Mock AuthContext if it's directly used for more than just dispatch or simple values
// For now, we assume Login doesn't heavily rely on complex context values for basic rendering/input
// jest.mock('../contexts/AuthContext', () => ({
//   useAuth: () => ({
//     // Mock any specific values or functions Login might call from useAuth
//     // For example: login: jest.fn(), error: null, loading: false
//   }),
// }));

describe('Login Page', () => {
  const renderLogin = () => {
    return render(
      <Router> {/* Wrap with Router if Login page or its children use Link, useNavigate etc. */}
        <Login />
      </Router>
    );
  };

  test('renders email and password input fields', () => {
    renderLogin();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  test('renders a submit button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    // If button text is different, adjust the name option accordingly e.g. /login/i
  });

  test('allows typing into the email field', () => {
    renderLogin();
    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');
  });

  test('allows typing into the password field', () => {
    renderLogin();
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput.value).toBe('password123');
  });

  // More tests can be added later for form submission, error handling, etc.
  // These would likely require mocking AuthContext dispatch/login function and API calls.
  // For example:
  // test('calls login function on form submission', () => {
  //   const mockLogin = jest.fn();
  //   // Setup mock for useAuth() to return mockLogin
  //   renderLogin();
  //   fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  //   expect(mockLogin).toHaveBeenCalled(); 
  //   // Further expect(mockLogin).toHaveBeenCalledWith(email, password);
  // });
});
