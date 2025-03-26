import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import './Admindash.css';
import { FaBars } from 'react-icons/fa';
import Logoutb from '../Logoutb/Logoutb';

const Admin = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessionData = async () => {
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('role'); // Retrieve the user role from local storage

      if (!token) {
        navigate('/login'); // Redirect to login if no token
        return;
      }

      // Check if the user role is not Admin
      if (userRole !== 'Admin') {
        navigate('/login'); // Redirect to login if the role is not Admin
        return;
      }
    };

    fetchSessionData();
  }, [navigate]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="admin-dashboard">
      <div className="top-bar">
        <FaBars className="menu-icon" onClick={toggleSidebar} />
        <h1>Admin</h1>
        {/* <div className="lg"><Logoutb /></div> */}
      </div>
      
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="dashboard-links">
          <Link to="addboat">Add Boat Type</Link>
          <Link to="viewusers">View Users</Link>
          <Link to="boatl">Registered Boat</Link>
          <Link to="boatapproval">Boat Approval</Link>
          {/* <Link to="manage-reviews">Manage Reviews</Link> */}
          {/* <Link to="delete-boats">Delete Boats</Link> */}
          {/* <Link to="">Delete Users</Link> */}
          {/* <Link to="manage-boat-owners">Manage Boat Owners</Link> */}
          {/* Add other links as needed */}
          <Link to="fraud-analysis">Fraud Analysis</Link>
          <Logoutb />
        </div>
      </div>

      <h1>Welcome Admin</h1>
      <div className="admin-content">
        {/* Render the nested routes here */}
        <Outlet />
      </div>
    </div>
  );
};

export default Admin;


// import React, { useState, useEffect } from 'react';
// import { Link, Outlet, useNavigate } from 'react-router-dom';
// import { useSelector } from 'react-redux'; // Add this line
// import './Admindash.css';
// import { FaBars } from 'react-icons/fa';
// import Logoutb from '../Logoutb/Logoutb';
// const Admin = () => {
//   const user = useSelector(state => state?.user?.user); // Fetching user from Redux state
//   const navigate = useNavigate(); // For navigation
  
//   useEffect(() => {
//     // Check if the user is not an Admin, redirect to login page
//     if (!user || user.role !== "Admin") {
//       navigate("/login"); 
//     }
//   }, [user, navigate]); // Ensure the hook depends on User and navigate

//   const [isOpen, setIsOpen] = useState(false);

//   const toggleSidebar = () => {
//     setIsOpen(!isOpen);
//   };

//   return (
//     <div className="admin-dashboard">
//       <div className="top-bar">
//         <FaBars className="menu-icon" onClick={toggleSidebar} />
//         <h1>Admin Dashboard</h1>
//       </div>
      
//       <div className={`sidebar ${isOpen ? 'open' : ''}`}>
//         <div className="dashboard-links">
//           <Link to="addboat">Add Boat</Link>
//           <Link to="viewusers">View Users</Link>
//           <Link to="boatl">Registered Boat</Link>
//           <Logoutb />
//         </div>
//       </div>
      
//       <div className="admin-content">
//         <Outlet /> {/* Render child routes here */}
//       </div>
//     </div>
//   );
// };

// export default Admin;

