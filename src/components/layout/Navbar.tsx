import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white shadow-md p-4">
      <ul className="flex space-x-4">
        <li>
          <Link to="/" className="text-blue-600 hover:text-blue-800">Dashboard</Link>
        </li>
        <li>
          <Link to="/editor" className="text-blue-600 hover:text-blue-800">Editor</Link>
        </li>
        <li>
          <Link to="/templates" className="text-blue-600 hover:text-blue-800">Templates</Link>
        </li>
        <li>
          <Link to="/deploy" className="text-blue-600 hover:text-blue-800">Deploy</Link>
        </li>
        <li>
          <Link to="/profile" className="text-blue-600 hover:text-blue-800">Profile</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
