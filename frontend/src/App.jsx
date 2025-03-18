import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './Components/Navbar/Navbar';
import Home from './Components/Home/Home';  // Import the Home component
import Loginp from './Components/Loginp/Loginp';
import Register from './Components/Register/Register'; 
import Admin from './Components/Admin/Admin';  // Use the AdminDashboard component
import UserInt from './Components/UserInt/UserInt';
import Boatowner from './Components/Boatowner/Boatowner';
import Logoutb from './Components/Logoutb/Logoutb';
import Addboat from './Components/Admin/Addboat';
import Viewusers from './Components/Admin/Viewusers';
import EditUser from './Components/Admin/EditUser';
import BoatRegistration from './Components/Boatowner/BoatRegistration';
import BoatList from './Components/Boatowner/BoatList';
import Boatlist from './Components/Admin/Boatlist';
import UserBoatList from './Components/UserInt/UserBoatList';
import BookingPage from './Components/UserInt/BookingPage';
import ForgotPassword from './Components/Loginp/ForgotPassword';
import ResetPassword from './Components/Loginp/ResetPassword';
import VerifyOtp from './Components/Register/VerifyOtp';
import BoatApproval from './Components/Admin/BoatApproval';
import BoatOwnerDashboard from './Components/Boatowner/BoatOwnerDashboard';
import LoadingSpinner from './Components/LoadingSpinner';
import SearchResults from './Components/UserInt/SearchResults';
import BoatViewDetails from './Components/UserInt/BoatViewDetails';
import BoatMenu from './Components/Boatowner/BoatMenu';
import BookingD from './Components/UserInt/BookingD';
import OwnerBoatsBookings from './Components/Boatowner/OwnerBookings';
// import Whatsapp from './Components/Loginp/whatsapp';
import AddFoodItem from './Components/Boatowner/AddFoodItem';
import FoodSelectionPage from './Components/UserInt/FoodSelectionPage';
import UserProfile from './Components/UserInt/UserProfile';
import BoatDetails from './Components/Boatowner/BoatDetails';

const AppWrapper = () => {
  const location = useLocation();
  
  // Define paths where Navbar should not be shown
  const noNavbarPaths = [ '/userint/*', '/admin/*', '/boatowner/*','/reset-password'];  // Updated the admin path

  // Determine if Navbar should be rendered
  const showNavbar = !noNavbarPaths.includes(location.pathname);

  return (
    <div>
      {showNavbar && <Navbar />}
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Loginp />} />
        <Route path="/register" element={<Register />} />
        <Route path="/userint" element={<UserInt />} />
        <Route path="/logout" element={<Logoutb />} />
        <Route path="/forgotp" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/load" element={<LoadingSpinner />} />

        
        {/* <Route path="/booking" element={<BookingPage />} /> */}

        {/* <Route path="/userboatl" element={<UserBoatList />} /> */}
    

        {/* Admin layout with nested routes */}
        <Route path="/admin/*" element={<Admin />}>
          <Route path="addboat" element={<Addboat />} />
          <Route path="viewusers" element={<Viewusers />} />
          <Route path="edituser/:id" element={<EditUser />} /> 
          <Route path="boatl" element={<Boatlist />} />
          <Route path="boatapproval" element={<BoatApproval />} />
          {/* <Route path="/search/:query" element={<SearchResults />} /> */}
          {/* Add more admin-related routes here */}
        </Route>

        <Route path="/boatowner/*" element={<Boatowner />}>
          <Route path="boatregister" element={<BoatRegistration />} />
          <Route path="boatlist" element={<BoatList />} />
          <Route path="boatdashboard" element={<BoatOwnerDashboard />} />
          <Route path="boatmenu/:boatId" element={<BoatMenu />} />
          <Route path="bookingsowner" element={<OwnerBoatsBookings />} /> {/* New route */}
          <Route path="add-food-item" element={<AddFoodItem />} />
          <Route path="boat-details/:boatId" element={<BoatDetails />} />
          
        </Route>

        <Route path="/userint/*" element={<UserInt />}>
          <Route path="userboatl" element={<UserBoatList />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="search/:query" element={<SearchResults />} />
          <Route path="boatviewdetails" element={<BoatViewDetails />} />
          <Route path="bookingd" element={<BookingD />} />
          <Route path="food-selection" element={<FoodSelectionPage />} />
          <Route path="userprofile" element={<UserProfile />} />
        </Route>

      </Routes>
    </div>
  );
};

const App = () => (
  <Router>
    <AppWrapper />
  </Router>
);

export default App;



