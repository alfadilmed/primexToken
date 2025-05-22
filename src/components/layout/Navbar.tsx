import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWeb3 } from '../../contexts/Web3Context'; // Import useWeb3

const Navbar: React.FC = () => {
  const { isAuthenticated, logout, isLoading: authIsLoading } = useAuth(); // Renamed isLoading to avoid conflict
  const { account, networkName, connectWallet, disconnectWallet, isLoading: web3IsLoading } = useWeb3(); // Use Web3 context
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex space-x-4">
          <Link to="/" className="text-blue-600 hover:text-blue-800">Dashboard</Link>
          {isAuthenticated && (
            <>
              <Link to="/editor" className="text-blue-600 hover:text-blue-800">Editor</Link>
              <Link to="/templates" className="text-blue-600 hover:text-blue-800">Templates</Link>
              <Link to="/generator" className="text-blue-600 hover:text-blue-800">Generator</Link> {/* Added Generator link */}
              <Link to="/deploy" className="text-blue-600 hover:text-blue-800">Deploy</Link>
            </>
          )}
        </div>
        <div className="flex space-x-4 items-center">
          {authIsLoading ? (
            <span className="text-gray-500 text-sm">Auth Loading...</span>
          ) : isAuthenticated ? (
            <>
              {web3IsLoading ? (
                 <span className="text-gray-500 text-sm">Wallet Connecting...</span>
              ) : account ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                    {networkName || 'Network?'} - {account.substring(0, 6)}...{account.substring(account.length - 4)}
                  </span>
                  <button 
                    onClick={disconnectWallet} 
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded text-xs"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              ) : (
                <button 
                  onClick={connectWallet} 
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1 px-3 rounded text-xs"
                >
                  Connect Wallet
                </button>
              )}
              <Link to="/profile" className="text-blue-600 hover:text-blue-800 text-sm">Profile</Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-blue-600 hover:text-blue-800 text-sm">Login</Link>
              <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
