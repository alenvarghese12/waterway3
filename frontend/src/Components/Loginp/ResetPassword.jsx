import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Resetp.css'

const ResetPassword = () => {
    const { token } = useParams(); // Get the token from URL
    const navigate = useNavigate(); // Hook to navigate user
    const [password, setPassword] = useState(''); // State for new password
    const [confirmPassword, setConfirmPassword] = useState(''); // State for confirming password
    const [message, setMessage] = useState(''); // State for messages
    const [error, setError] = useState(''); // State for errors

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
    
        setLoading(true); // Set loading state
        try {
            const { data } = await axios.post(`http://localhost:8080/api/auth/resetpassword/${token}`, { password });
            setMessage(data.message);
            setError('');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            console.error("Error resetting password:", error.response ? error.response.data : error.message);
            setError(error.response?.data?.message || "Error resetting password");
        } finally {
            setLoading(false); // Reset loading state
        }
    };
    
    return (
        <div className="reset-password-container">
            <h2>Reset Password</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Resetting..." : "Submit"}
                </button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {message && <p style={{ color: 'green' }}>{message}</p>}
        </div>
    );
    
};

export default ResetPassword;
