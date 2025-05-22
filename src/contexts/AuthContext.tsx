import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  _id: string;
  email: string;
  createdAt: string;
  // Add other user properties as needed
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void; // Modified to accept token and user directly
  logout: () => void;
  loadUser: () => Promise<void>; // For initial load and token validation
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true

  const API_URL = process.env.REACT_APP_API_URL || ''; // Ensure your backend URL is set in .env

  // Function to set up axios headers
  const setAuthToken = (token: string | null) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true); // Assume authenticated if token exists, loadUser will verify
      loadUser(); // Attempt to load user data if token exists
    } else {
      setIsLoading(false); // No token, so not loading user
      setIsAuthenticated(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Rerun when token changes

  const loadUser = async () => {
    setIsLoading(true);
    const currentToken = localStorage.getItem('authToken');
    if (!currentToken) {
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        setAuthToken(null);
        setIsLoading(false);
        return;
    }
    setAuthToken(currentToken); // Ensure headers are set for this request

    try {
      const response = await axios.get<User>(`${API_URL}/api/users/me`);
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('authToken'); // Token might be invalid
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      setAuthToken(null); // Clear auth header
    } finally {
      setIsLoading(false);
    }
  };
  
  // Simplified login - expects token and user from page components
  const login = (newToken: string, userData: User) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
    setAuthToken(newToken);
    setIsLoading(false); // Finished loading/logging in
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthToken(null); // Clear auth header
    setIsLoading(false);
    // Optionally redirect: navigate('/login'); - but better handled in components
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, isLoading, login, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
