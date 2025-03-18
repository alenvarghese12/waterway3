import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import './Boatowner.css'; // Custom CSS file for styling
import Logoutb from '../Logoutb/Logoutb'; // Assuming this is your Logout button component
import userIcon from '../Assets/user-icon.png';

const Boatowner = () => {
  const [userDetails, setUserDetails] = useState({
    name: '',
    licenseNumber: '',
    email: '',
  });
  const [error, setError] = useState(null);
  const [ownerId, setOwnerId] = useState(null); // State to hold owner ID
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessionData = async () => {
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('role'); // Retrieve the user role from local storage

      if (!token) {
        navigate('/login');
        return;
      }

      if (userRole !== 'BoatOwner') {
        navigate('/login');
        return;
      }

      try {
        console.log("Fetching session data with token:", token);
        const response = await fetch('http://localhost:8080/api/auth/sessionn', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        console.log("Fetched user data:", data);

        setUserDetails({
          name: data.name,
          licenseNumber: data.licenseNumber,
          email: data.email,
        });
        setOwnerId(data.id); // Set the owner ID from the fetched data
      } catch (error) {
        console.error('Error fetching session data:', error);
        setError(error.message);
      }
    };

    fetchSessionData();
  }, [navigate]);

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="boatowner-dashboard">
      <nav className="navbar">
        <ul>
          <li><Link to="boatregister" state={{ ownerId }}>Register Boat</Link></li>
          <li><Link to="boatlist">Boat Details</Link></li>
          <li><Link to="bookingsowner" state={{ ownerId }}>Bookings</Link></li> {/* Pass ownerId here */}
          <li><Logoutb /></li>
          <li className="user-info">
            <img src={userIcon} alt="User Icon" className="user-icon" />
            <h4>{userDetails.name}</h4>
          </li>
        </ul>
      </nav>

      <div className="dashboard-header">
        <h1>Welcome, {userDetails.name ? userDetails.name : 'Boatowner'}</h1>
        <p>Email: {userDetails.email}</p>
        <p>License Number: {userDetails.licenseNumber}</p>
      </div>

      <div className="boatowner-content">
        <Outlet context={{ ownerId }} /> {/* Pass ownerId to Outlet */}
      </div>
    </div>
  );
};

export default Boatowner;

