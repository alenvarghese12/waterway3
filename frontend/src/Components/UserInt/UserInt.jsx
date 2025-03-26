// import React, { useState, useEffect } from 'react';
// import { Link, Outlet, useNavigate } from 'react-router-dom';
// import './UserNavbar.css';
// import Logoutb from '../Logoutb/Logoutb';
// import { FaSearch } from 'react-icons/fa';

// const UserInt = () => {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [userDetails, setUserDetails] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Get token from the URL query params
//     const queryParams = new URLSearchParams(window.location.search);
//     const token = queryParams.get('token');

//     if (token) {
//       // Store the token in localStorage for future API calls
//       localStorage.setItem('token', token);
      
//       // Clear the token from the URL after storing it
//       window.history.replaceState({}, document.title, window.location.pathname);
      
//       // Redirect to the main user interface or fetch user data
//       navigate('/userint'); 
//     }
//   }, [navigate]);




//   useEffect(() => {
//     const fetchSessionData = async () => {
//       const token = localStorage.getItem('token');

//       if (!token) {
//         navigate('/login');
//         return;
//       }

//       try {
//         console.log("Fetching session data with token:", token);
//         const response = await fetch('http://localhost:8080/api/auth/sessionn', {
//           method: 'GET',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         });

//         if (!response.ok) {
//           const errorText = await response.text();
//           throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
//         }

//         const data = await response.json();
//         console.log("Fetched user data:", data);

//         setUserDetails({
//           name: data.name,
//           email: data.email,
//           licenseNumber: data.licenseNumber || null,
//         });
//         setLoading(false);
//       } catch (error) {
//         console.error('Error fetching session data:', error);
//         setError(error.message);
//         setLoading(false);
//       }
//     };

//     fetchSessionData();
//   }, [navigate]);

//   const handleSearchChange = (e) => {
//     const query = e.target.value;
//     setSearchQuery(query);
//     navigate(`/userint/search/${query}`);
//   };

//   const toggleSidebar = () => {
//     setIsSidebarOpen(!isSidebarOpen);
//   };

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (error) {
//     return <div>Error: {error}</div>;
//   }

//   return (
//     <div className="user-navbar">
//       <div className="top-navbar">
//         <button className="sidebar-toggle" onClick={toggleSidebar}>
//           ☰
//         </button>
//         <h1 className="navbar-title">Waterway</h1>
//         <div className="search-box">
//           <input 
//             type="text" 
//             className="search-input"
//             placeholder="Search...."
//             value={searchQuery}
//             onChange={handleSearchChange}
//           />
//           <FaSearch className="search-icon" />
//         </div>
        
//         <div className="nav-links">
//           <Link to="userboatl" className="nav-link">Boats</Link>
//         </div>

//         {userDetails && (
//           <>
//             <li style={{ color: "black", fontWeight: "bold" }}>{userDetails.name}</li>
//             <li>{userDetails.email}</li>
//           </>
//         )}
//       </div>

//       <div className={`side-navbar ${isSidebarOpen ? 'open' : ''}`}>
//         <Logoutb />
//       </div>
      
//       <Outlet />
//     </div>
//   );
// };

// export default UserInt;
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import './UserNavbar.css';
import Logoutb from '../Logoutb/Logoutb';
import { FaSearch, FaUserCircle } from 'react-icons/fa';

const UserInt = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessionData = async () => {
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('role'); // Retrieve the user role from local storage

      if (!token) {
        navigate('/login');
        return;
      }

      // Check if the user role is admin or boatowner
      if (userRole === 'Admin' || userRole === 'BoatOwner') {
        navigate('/login'); // Redirect to login if the role is not allowed
        return;
      }

      try {
        console.log("Fetching session data with token:", token);
        const response = await fetch('http://localhost:8080/api/auth/sessionn', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        console.log('Fetched user data:', data);
        setUserDetails({
          id: data.id, // Ensure we're capturing the user's ID
          name: data.name,
          email: data.email,
          licenseNumber: data.licenseNumber || null,
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching session data:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [navigate]);

  useEffect(() => {
    // Push a new entry to the history stack to prevent going back to the login page
    window.history.pushState(null, null, window.location.href);

    const handlePopState = (event) => {
      // Redirect to the current page if trying to go back
      navigate('/userint'); // Redirect to the current page or another appropriate page
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    navigate(`/userint/search/${query}`);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    // Clear token and role from local storage
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    navigate('/login'); // Redirect to login page on logout
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="user-navbar">
      <div className="top-navbar">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          ☰
        </button>
        <h1 className="navbar-title">Waterway</h1>
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="Search...."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <FaSearch className="search-icon" />
        </div>

        <div className="nav-links">
         <Link 
  to="userboatl" 
  state={{ userDetails: { id: userDetails?.id, name: userDetails?.name, email: userDetails?.email } }} 
  className="nav-link"
>
  Boats
</Link>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
<Link 
  to="bookingd" 
  state={{ userDetails: { id: userDetails?.id, name: userDetails?.name, email: userDetails?.email } }} 
  className="nav-link"
>
  View Bookings
</Link>
        </div>

        {userDetails && (
          <ul className="user-profile-section">
            <li style={{ color: 'black', fontWeight: 'bold' }}>
              <FaUserCircle className="profile-icon" /> {userDetails.name}
            </li>
          </ul>
        )}
      </div>

      <div className={`side-navbar ${isSidebarOpen ? 'open' : ''}`}>
        <Link to="userprofile" state={{ userDetails: { id: userDetails?.id, name: userDetails?.name, email: userDetails?.email } }} className="nav-link">Profile</Link>
        <Logoutb onClick={handleLogout} /> {/* Pass the logout handler to the Logoutb component */}
      </div>

      <div className="content-wrapper">
        <Outlet context={{ userDetails: { id: userDetails?.id, name: userDetails?.name, email: userDetails?.email } }} />
      </div>
    </div>
  );
};

export default UserInt;
