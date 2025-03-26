// import React, { useState } from 'react';
// import axios from 'axios';
// import './ForgotP.css';

// const ForgotPassword = () => {
//     const [email, setEmail] = useState('');
//     const [message, setMessage] = useState('');
//     const [loading, setLoading] = useState(false);
//     const [emailError, setEmailError] = useState(''); // New state to handle email errors

//     // Basic email validation function
//     const validateEmail = (email) => {
//         const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         return regex.test(email);
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setEmailError('');
        
//         // Validate email before making the request
//         if (!validateEmail(email)) {
//             setEmailError('Please enter a valid email address');
//             return;
//         }

//         setLoading(true);
//         try {
//             const { data } = await axios.post('http://localhost:8080/api/auth/forgot-password', { email });
//             setMessage(data.message);
//         } catch (error) {
//             setMessage(error.response?.data?.message || 'Error processing your request');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div>
//             <h2>Forgot Password</h2>
//             <form onSubmit={handleSubmit}>
//                 <input
//                     type="email"
//                     placeholder="Enter your email"
//                     aria-label="Email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     required
//                 />
//                 {emailError && <p style={{ color: 'red' }}>{emailError}</p>} {/* Display email error */}
//                 <button type="submit" disabled={loading}>
//                     {loading ? 'Processing...' : 'Submit'}
//                 </button>
//             </form>
//             {message && <p>{message}</p>} {/* Display server response message */}
//         </div>
//     );
// };

// export default ForgotPassword;






import React, { useState } from 'react';
import axios from 'axios';
import './ForgotP.css'; // Import the CSS file

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState('');

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setEmailError('');
        
        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            const { data } = await axios.post('http://localhost:8080/api/auth/forgot-password', { email });
            setMessage(data.message);

            if (data.message && data.message.toLowerCase().includes('sent')) {
                alert('Password reset link has been sent to your email!');
            }
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error processing your request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-container">
            <h2>Forgot Password</h2>
            <form className="forgot-password-form" onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Enter your email"
                    aria-label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                {emailError && <p className="error-message">{emailError}</p>}
                <button type="submit" disabled={loading}>
                    {loading ? 'Processing...' : 'Submit'}
                </button>
            </form>
            {message && <p className={message.includes('sent') ? 'success-message' : 'error-message'}>{message}</p>}
        </div>
    );
};

export default ForgotPassword;
