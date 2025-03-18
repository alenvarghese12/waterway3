import './Loginp.css'
import Background from '../Background/Background';
import { FaUser, FaLock } from "react-icons/fa";
import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { login, setLoading, setError } from '../store/userSlice'; // Import your actions

const Loginp = () => {
  const [heroCount, setHero] = useState(4);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch(); // Initialize dispatch

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        const url = "https://waterway3.onrender.com/api/auth/login";
        console.log("Sending login request with:", formData); // Add logging
        const { data: res } = await axios.post(url, formData);
        console.log("Login response:", res); // Add logging

        // Check if login was successful
        if (res.redirectUrl) {
            // Store email and token in localStorage
            localStorage.setItem('email', formData.email); // Save the correct email
            localStorage.setItem('token', res.token); // Save the token
            const token = localStorage.getItem('token'); // Get the token from local storage
            const decodedToken = JSON.parse(atob(token.split('.')[1])); // Manually decode the token
            localStorage.setItem('role', decodedToken.role);
            localStorage.setItem('userId', decodedToken.id);


            dispatch(login({ email: formData.email, token: res.token }));
            // Navigate to the redirect URL
            navigate(res.redirectUrl);
        } else {
          dispatch(setError("Server error. Please try again later.")); 
        }
    } catch (error) {
        console.error("Login error:", error); // Add logging
        if (error.response && error.response.status >= 400 && error.response.status <= 500) {
          dispatch(setError(error.response.data.message)); 
        } else {
            setError("Server error. Please try again later.");
        }
    }
};

useEffect(() => {
  const email = localStorage.getItem('email')
  const role =localStorage.getItem('role')

  if (email) {
    if(role === 'User')
    {
      navigate('/userint/userboatl');
    }
    else if(role === 'Admin')
      {
        navigate('/admin');
      }
      else if(role === 'BoatOwner')
        {
          navigate('/boatowner/boatlist');
        }
    else{
      navigate('/login');
    }
    // Optionally show a session expired message
  }
  
}, [navigate]);


  const handleRegisterClick = (e) => {
    e.preventDefault();
    navigate('/register');
  };

  return (
    <div>
      <Background heroCount={heroCount} />
      <div className='login-wrapper'>
        <form className='login-form' onSubmit={handleSubmit}>
          <h1>Login</h1>
          {error && <p className="error">{error}</p>}
          <div className="input-box">
            <input
              type="text"
              name="email"
              placeholder='Email'
              value={formData.email}
              onChange={handleChange}
            />
            <FaUser className='icon' />
          </div>
          <div className="input-box">
            <input
              type="password"
              name="password"
              placeholder='Password'
              value={formData.password}
              onChange={handleChange}
            />
            <FaLock className='icon' />
          </div>
          <div className="remember-forgot">
            <label>
              <input type='checkbox' /> Remember me
            </label>
            <a href='/forgotp'>Forgot Password?</a>
          </div>
          <button type='submit' className='loginb'>Login</button>
          <div className="register-link">
            <p>Don't have an account? <a href='#' id='register' onClick={handleRegisterClick}>Register</a></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Loginp;






// import './LoginP.css';
// import Background from '../Background/Background';
// import { FaUser, FaLock } from "react-icons/fa";
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';

// const Loginp = () => {
//   const [heroCount, setHero] = useState(4);
//   const [formData, setFormData] = useState({ email: '', password: '' });
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const url = "https://waterway3.onrender.com/api/auth/login";
//       const { data: res } = await axios.post(url, formData, { withCredentials: true });

//       if (res.redirectUrl) {
//         navigate(res.redirectUrl);
//       } else {
//         setError("Unexpected error during login.");
//       }
//     } catch (error) {
//       if (error.response && error.response.status >= 400 && error.response.status <= 500) {
//         setError(error.response.data.message);
//       } else {
//         setError("Server error. Please try again later.");
//       }
//     }
//   };

//   const handleRegisterClick = (e) => {
//     e.preventDefault();
//     navigate('/register');
//   };

//   const handleGoogleLogin = () => {
//     window.location.href = "https://waterway3.onrender.com/api/auth/google";
//   };

//   return (
//     <div>
//       <Background heroCount={heroCount} />
//       <div className='login-wrapper'>
//         <form className='login-form' onSubmit={handleSubmit}>
//           <h1>Login</h1>
//           {error && <p className="error">{error}</p>}
//           <div className="input-box">
//             <input
//               type="text"
//               name="email"
//               placeholder='Email'
//               value={formData.email}
//               onChange={handleChange}
//             />
//             <FaUser className='icon' />
//           </div>
//           <div className="input-box">
//             <input
//               type="password"
//               name="password"
//               placeholder='Password'
//               value={formData.password}
//               onChange={handleChange}
//             />
//             <FaLock className='icon' />
//           </div>
//           <div className="remember-forgot">
//             <label>
//               <input type='checkbox' /> Remember me
//             </label>
//             <a href='#'>Forgot Password?</a>
//           </div>
//           <button type='submit' className='loginb'>Login</button>
          
//           {/* Google Sign-In button */}
//           <button type='button' className='google-login-btn' onClick={handleGoogleLogin}>
//             Sign in with Google
//           </button>
          
//           <div className="register-link">
//             <p>Don't have an account? <a href='#' onClick={handleRegisterClick}>Register</a></p>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default Loginp;
