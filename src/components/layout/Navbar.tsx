import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout, isLoading } = useAuth();
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
          {isLoading ? (
            <span className="text-gray-500">Loading...</span>
          ) : isAuthenticated ? (
            <>
              <Link to="/profile" className="text-blue-600 hover:text-blue-800">Profile</Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-blue-600 hover:text-blue-800">Login</Link>
              <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm">
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
