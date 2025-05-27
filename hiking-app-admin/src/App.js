import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Components
import Dashboard from './components/dashboard/Dashboard';
import UserManagement from './components/users/UserManagement';
import TrailManagement from './components/trails/TrailManagement';
import SocialMediaManagement from './components/social/SocialMediaManagement';
import ActivityManagement from './components/activities/ActivityManagement';
import HikeHistory from './components/activities/HikeHistory'; // Import the new component
import Login from './components/auth/Login';
import ProtectedRoute from './components/common/ProtectedRoute';
import ForumAdmin from './pages/ForumAdmin';

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/users" element={
          <ProtectedRoute>
            <UserManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/trails" element={
          <ProtectedRoute>
            <TrailManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/social" element={
          <ProtectedRoute>
            <SocialMediaManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/activities" element={
          <ProtectedRoute>
            <ActivityManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/hike-history" element={
          <ProtectedRoute>
            <HikeHistory />
          </ProtectedRoute>
        } />
        
        <Route path="/forum-admin" element={<ForumAdmin />} />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Catch-all route for 404 handling */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
