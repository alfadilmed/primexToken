import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import Templates from './pages/Templates';
import Deploy from './pages/Deploy';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Login from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SmartContractGenerator from './pages/SmartContractGenerator'; // Import the new page

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="editor" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
            <Route path="templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
            <Route path="deploy" element={<ProtectedRoute><Deploy /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="generator" element={<ProtectedRoute><SmartContractGenerator /></ProtectedRoute>} /> 
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
