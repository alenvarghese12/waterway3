import React from 'react';
import './Logoutb.css'; // Import the CSS file
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Logoutb = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
     
      const response = await axios.post('http://localhost:8080/api/auth/logoutp');
      if (response.data.message === 'Logged out successfully') {
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        // session.removeItem('user'); // Remove user session data from localStorage
        // window.location.href = '/login'; // Redirect to the login page after logout
        navigate('/login'); 
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  
  return (
    <button className="logout-button" onClick={handleLogout}>Logout</button>
  );
};

export default Logoutb;