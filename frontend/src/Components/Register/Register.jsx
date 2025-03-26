// import React, { useState } from 'react';
// import { FaUser, FaEnvelope, FaLock, FaIdCard } from 'react-icons/fa'; 
// import { Link, useNavigate } from 'react-router-dom'; 
// import Background from '../Background/Background';
// import './Register.css';
// import axios from 'axios';

// const Register = () => {
//   const [heroCount, setHero] = useState(4);
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     password: '',
//     confirmPassword: '', // Added confirmPassword field
//     role: 'User', // Default value
//     status: 'Active', // Default value
//     licenseNumber: '' // Added licenseNumber field
//   });
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (formData.password !== formData.confirmPassword) {
//       setError("Passwords do not match!");
//       return;
//     }

//     try {
//       const url = "http://localhost:8080/api/users";
//       const { data: res } = await axios.post(url, {
//         name: formData.name,
//         email: formData.email,
//         password: formData.password,
//         role: formData.role,
//         status: formData.status,
//         licenseNumber: formData.role === 'BoatOwner' ? formData.licenseNumber : undefined // Send licenseNumber only if role is BoatOwner
//       });
//       navigate("/login"); // Use navigate hook for redirect
//       console.log(res.message);
//     } catch (error) {
//       if (error.response && error.response.status >= 400 && error.response.status <= 500) {
//         setError(error.response.data.message || 'Registration failed');
//       } else {
//         setError('An unexpected error occurred');
//       }
//     }
//   };

//   return (
//     <div>
//       <Background heroCount={heroCount} />
//       <div className="register-wrapper">
//         <form className="register-form" onSubmit={handleSubmit}>
//           <h1>Register</h1>
//           {error && <p className="error">{error}</p>} {/* Display error message if any */}
//           <div className="input-box">
//             <input 
//               type="text" 
//               placeholder="Name" 
//               name="name"
//               value={formData.name} 
//               onChange={handleChange} 
//               required 
//             />
//             <FaUser className="icon" />
//           </div>
//           <div className="input-box">
//             <input 
//               type="email" 
//               placeholder="Email" 
//               name="email"
//               value={formData.email} 
//               onChange={handleChange} 
//               required 
//             />
//             <FaEnvelope className="icon" />
//           </div>
//           <div className="input-box">
//             <input 
//               type="password" 
//               placeholder="Password" 
//               name="password"
//               value={formData.password} 
//               onChange={handleChange} 
//               required 
//             />
//             <FaLock className="icon" />
//           </div>
//           <div className="input-box">
//             <input 
//               type="password" 
//               placeholder="Confirm Password" 
//               name="confirmPassword"
//               value={formData.confirmPassword} 
//               onChange={handleChange} 
//               required 
//             />
//             <FaLock className="icon" />
//           </div>
//           <div className="input-box">
//             <select 
//               name="role"
//               value={formData.role} 
//               onChange={handleChange} 
//               required
//             >
//               <option value="User">User</option>
//               <option value="BoatOwner">BoatOwner</option>
//             </select>
//           </div>
//           {formData.role === 'BoatOwner' && (
//             <div className="input-box">
//               <input 
//                 type="text" 
//                 placeholder="License Number" 
//                 name="licenseNumber"
//                 value={formData.licenseNumber} 
//                 onChange={handleChange} 
//                 required 
//               />
//               <FaIdCard className="icon" />
//             </div>
//           )}
//           <button type="submit" className="register-button">Register</button>
//           <div className="login-link">
//             <p>Already have an account? <Link to="/login">Login here</Link></p>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default Register;



// import React, { useState } from 'react';
// import { FaUser, FaEnvelope, FaLock, FaIdCard } from 'react-icons/fa';
// import { Link, useNavigate } from 'react-router-dom';
// import Background from '../Background/Background';
// import './Register.css';
// import axios from 'axios';

// const Register = () => {
//   const [heroCount, setHero] = useState(4);
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//     role: 'User',
//     status: 'Active',
//     licenseNumber: ''
//   });
//   const [errors, setErrors] = useState({});
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   const validateName = (name) => {
//     const nameRegex = /^[^\d][a-zA-Z\s]*$/;
//     return nameRegex.test(name) || "Name must not start with a number.";
//   };

//   const validateEmail = (email) => {
//     const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in|org|gov|edu|co|net)$/;
//     return emailRegex.test(email) || "Invalid email format. Use domains like .com, .org, etc.";
//   };

//   const validatePassword = (password) => {
//     const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
//     return passwordRegex.test(password) || "Password must be 8 characters long, and contain uppercase, lowercase, a number, and a special character.";
//   };

//   const validateConfirmPassword = (confirmPassword) => {
//     return formData.password === confirmPassword || "Passwords do not match.";
//   };

//   const validateLicenseNumber = (licenseNumber) => {
//     // Example: Allow alphanumeric with specific length (modify as needed)
//     const licenseRegex = /^[a-zA-Z0-9]{6,12}$/;
//     return licenseRegex.test(licenseNumber) || "Invalid license number.";
//   };

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });

//     // Perform validation based on field
//     let fieldError = '';
//     switch (e.target.name) {
//       case 'name':
//         fieldError = validateName(e.target.value);
//         break;
//       case 'email':
//         fieldError = validateEmail(e.target.value);
//         break;
//       case 'password':
//         fieldError = validatePassword(e.target.value);
//         break;
//       case 'confirmPassword':
//         fieldError = validateConfirmPassword(e.target.value);
//         break;
//       case 'licenseNumber':
//         fieldError = validateLicenseNumber(e.target.value);
//         break;
//       default:
//         break;
//     }
//     setErrors({ ...errors, [e.target.name]: fieldError });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
  
//     // Check if there are any validation errors before submitting
//     const newErrors = {
//       name: validateName(formData.name),
//       email: validateEmail(formData.email),
//       password: validatePassword(formData.password),
//       confirmPassword: validateConfirmPassword(formData.confirmPassword),
//       licenseNumber: formData.role === 'BoatOwner' ? validateLicenseNumber(formData.licenseNumber) : '', // For BoatOwner only
//     };
  
//     setErrors(newErrors);
  
//     const hasErrors = Object.values(newErrors).some(error => error !== true);
//     if (hasErrors) {
//       return;
//     }
  
//     try {
//       const url = "http://localhost:8080/api/users";
//       const userPayload = {
//         name: formData.name,
//         email: formData.email,
//         password: formData.password,
//         role: formData.role,
//         status: formData.status
//       };
  
//       // Add licenseNumber only for BoatOwner
//       if (formData.role === 'BoatOwner') {
//         userPayload.licenseNumber = formData.licenseNumber;
//       }
  
//       const { data: res } = await axios.post(url, userPayload);
//       navigate("/login");
//       console.log(res.message);
//     } catch (error) {
//       if (error.response && error.response.status >= 400 && error.response.status <= 500) {
//         setError(error.response.data.message || 'Registration failed');
//       } else {
//         setError('An unexpected error occurred');
//       }
//     }
//   };
  
//   return (
//     <div>
//       <Background heroCount={heroCount} />
//       <div className="register-wrapper">
//         <form className="register-form" onSubmit={handleSubmit}>
//           <h1>Register</h1>
//           {error && <p className="error">{error}</p>}
          
//           <div className="input-box">
//             <select 
//               name="role"
//               value={formData.role} 
//               onChange={handleChange} 
//               required
//             >
//               <option value="User">User</option>
//               <option value="BoatOwner">BoatOwner</option>
//             </select>
//           </div>

//           {formData.role === 'BoatOwner' && (
//             <div className="input-box">
//               <input 
//                 type="text" 
//                 placeholder="License Number" 
//                 name="licenseNumber"
//                 value={formData.licenseNumber} 
//                 onChange={handleChange} 
//                 required 
//               />
//               <FaIdCard className="icon" />
//               {/* {errors.licenseNumber && <p className="error">{errors.licenseNumber}</p>} */}
//             </div>
            
//           )}
//           {errors.licenseNumber && <p className="error">{errors.licenseNumber}</p>}


//           <div className="input-box">
//             <input 
//               type="text" 
//               placeholder="Name" 
//               name="name"
//               value={formData.name} 
//               onChange={handleChange} 
//               required 
//             />
//             <FaUser className="icon" />
//             {/* {errors.name && <p className="error">{errors.name}</p>} */}
//           </div>
//           {errors.name && <p className="error">{errors.name}</p>}
//           <div className="input-box">
//             <input 
//               type="email" 
//               placeholder="Email" 
//               name="email"
//               value={formData.email} 
//               onChange={handleChange} 
//               required 
//             />
//             <FaEnvelope className="icon" />
//             {/* {errors.email && <p className="error">{errors.email}</p>} */}
//           </div>
//           {errors.email && <p className="error">{errors.email}</p>}

//           <div className="input-box">
//             <input 
//               type="password" 
//               placeholder="Password" 
//               name="password"
//               value={formData.password} 
//               onChange={handleChange} 
//               required 
//             />
//             <FaLock className="icon" />
//             {/* {errors.password && <p className="error">{errors.password}</p>} */}
//           </div>
//           {errors.password && <p className="error">{errors.password}</p>}

//           <div className="input-box">
//             <input 
//               type="password" 
//               placeholder="Confirm Password" 
//               name="confirmPassword"
//               value={formData.confirmPassword} 
//               onChange={handleChange} 
//               required 
//             />
//             <FaLock className="icon" />
//             {/* {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>} */}
//           </div>
//           {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
          

//           <button type="submit" className="register-button">Register</button>

//           {formData.role !== 'BoatOwner' && (
//             <button type="button" className="google-signup-button">
//               Sign Up With Google
//             </button>
//           )}

//           <div className="login-link">
//             <p>Already have an account? <Link to="/login">Login here</Link></p>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default Register;










import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaLock, FaIdCard } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import Background from '../Background/Background';
import './Register.css';
import axios from 'axios';

const Register = () => {
  const [heroCount, setHero] = useState(4);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'User',
    status: 'Active',
    licenseNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validateName = (name) => {
    const nameRegex = /^[^\d][a-zA-Z\s]*$/;
    return nameRegex.test(name) || "Name must not start with a number.";
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in|org|gov|edu|co|net)$/;
    return emailRegex.test(email) || "Invalid email format. Use domains like .com, .org, etc.";
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password) || "Password must be 8 characters long, and contain uppercase, lowercase, a number, and a special character.";
  };

  const validateConfirmPassword = (confirmPassword) => {
    return formData.password === confirmPassword || "Passwords do not match.";
  };

  const validateLicenseNumber = (licenseNumber) => {
    const licenseRegex = /^[a-zA-Z0-9]{6,12}$/;
    return licenseRegex.test(licenseNumber) || "Invalid license number.";
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    let fieldError = '';
    switch (e.target.name) {
      case 'name':
        fieldError = validateName(e.target.value);
        break;
      case 'email':
        fieldError = validateEmail(e.target.value);
        break;
      case 'password':
        fieldError = validatePassword(e.target.value);
        break;
      case 'confirmPassword':
        fieldError = validateConfirmPassword(e.target.value);
        break;
      case 'licenseNumber':
        fieldError = validateLicenseNumber(e.target.value);
        break;
      default:
        break;
    }
    setErrors({ ...errors, [e.target.name]: fieldError });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const newErrors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.confirmPassword),
      // licenseNumber: formData.role === 'BoatOwner' ? validateLicenseNumber(formData.licenseNumber) : '',
    };
  
    setErrors(newErrors);
  
    const hasErrors = Object.values(newErrors).some(error => error !== true);
    if (hasErrors) {
      return;
    }
  
    try {
      const url = "http://localhost:8080/api/users";
      const { data: res } = await axios.post(url, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        status: formData.status,
        licenseNumber: formData.role === 'BoatOwner' ? formData.licenseNumber : undefined // Send licenseNumber only if role is BoatOwner
      });
      
      localStorage.setItem("email", formData.email);  // Store email for OTP verification
      navigate("/verify-otp");  // Redirect to OTP verification page
    } catch (error) {
      if (error.response && error.response.status >= 400 && error.response.status <= 500) {
        setError(error.response.data.message || 'Registration failed');
      } else {
        setError('An unexpected error occurred');
      }
    }
  };
  

  const handleGoogleSignIn = () => {
    window.open("http://localhost:8080/auth/google/callback", "_self")
};

  return (
    <div>
      <Background heroCount={heroCount} />
      <div className="register-wrapper">
        <form className="register-form" onSubmit={handleSubmit}>
          <h1>Register</h1>
          {error && <p className="error">{error}</p>}
          
          <div className="input-box">
            <select 
              id='role'
              name="role"
              value={formData.role} 
              onChange={handleChange} 
              required
            >
              <option value="User">User</option>
              <option value="BoatOwner">BoatOwner</option>
            </select>
          </div>

          {formData.role === 'BoatOwner' && (
            <div className="input-box">
              <input 
                id='licenseNumber'
                type="text" 
                placeholder="License Number" 
                name="licenseNumber"
                value={formData.licenseNumber} 
                onChange={handleChange} 
                required 
              />
              <FaIdCard className="icon" />
            </div>
          )}
          {errors.licenseNumber && <p className="error">{errors.licenseNumber}</p>}

          <div className="input-box">
            <input 
              id='name'
              type="text" 
              placeholder="Name" 
              name="name"
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
            <FaUser className="icon" />
          </div>
          {errors.name && <p className="error">{errors.name}</p>}
          
          <div className="input-box">
            <input 
              id='email'
              type="email" 
              placeholder="Email" 
              name="email"
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
            <FaEnvelope className="icon" />
          </div>
          {errors.email && <p className="error">{errors.email}</p>}

          <div className="input-box">
            <input 
              id='password'
              type="password" 
              placeholder="Password" 
              name="password"
              value={formData.password} 
              onChange={handleChange} 
              required 
            />
            <FaLock className="icon" />
          </div>
          {errors.password && <p className="error">{errors.password}</p>}

          <div className="input-box">
            <input 
              id='confirmPassword'
              type="password" 
              placeholder="Confirm Password" 
              name="confirmPassword"
              value={formData.confirmPassword} 
              onChange={handleChange} 
              required 
            />
            <FaLock className="icon" />
          </div>
          {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
          
          <button type="submit" id='register' className="register-button">Register</button>

          {formData.role === 'User' && (
            <button type="button" id='google' className="google-signup-button" onClick={handleGoogleSignIn}>
              Sign Up With Google
            </button>
          )}

          <div className="login-link">
            <p>Already have an account? <Link to="/login">Login here</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
