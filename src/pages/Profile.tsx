import React from 'react';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
// import { ethers } from 'ethers'; // Will be used for wallet interaction
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, isLoading, loadUser, logout } = useAuth(); // Assuming loadUser refetches user from backend
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Explicitly navigate to login after logout
  };

  const connectWalletHandler = async () => {
    setError(null);
    setIsConnecting(true);
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask is not installed. Please install it to connect your wallet.');
      setIsConnecting(false);
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      
      if (account) {
        // Call backend to link wallet
        await axios.put('/api/users/me/wallet', { walletAddress: account });
        // Refresh user data in context
        await loadUser(); // This should fetch the updated user with walletAddress
        // The UI should update automatically due to context change
      }
    } catch (err: any) {
      console.error('Error connecting wallet or linking to backend:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Failed to link wallet.');
      } else if (err.code === 4001) { // User rejected the request
        setError('MetaMask connection request was rejected.');
      }
      else {
        setError('An error occurred while connecting the wallet.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  if (!user) {
    return <div className="p-8 text-center text-red-500">Could not load user profile.</div>;
  }

  return (
    <div className="p-8">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Profile</h1>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="mt-1 text-lg text-gray-900">{user.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Wallet Address</p>
            {user.walletAddress ? (
              <div className="mt-1">
                <p className="text-lg text-green-600 bg-green-50 p-2 rounded break-all">{user.walletAddress}</p>
                {/* Placeholder for future "Change/Unlink Wallet" button */}
                {/* <button 
                  onClick={() => alert("Unlink/Change wallet functionality to be implemented.")}
                  className="mt-2 text-sm text-blue-500 hover:text-blue-700"
                >
                  Change Wallet
                </button> */}
              </div>
            ) : (
              <div className="mt-1">
                <p className="text-gray-700">No wallet connected.</p>
                <button
                  onClick={connectWalletHandler}
                  disabled={isConnecting}
                  className="mt-2 group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              </div>
            )}
          </div>
          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded">
              Error: {error}
            </div>
          )}
          {/* Display other user information as needed */}
          <div className="mt-8 border-t pt-6">
            <button
              onClick={handleLogout}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
