import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) {
    // If no token, redirect to login
    return <Navigate to="/login" />;
  }

  if (role && userRole !== role) {
    // If role mismatch, redirect to the appropriate dashboard
    return <Navigate to={userRole === 'Admin' ? '/admindashboard' : '/userdashboard'} />;
  }

  // Allow access if token exists and role matches
  return children;
};

export default ProtectedRoute;
