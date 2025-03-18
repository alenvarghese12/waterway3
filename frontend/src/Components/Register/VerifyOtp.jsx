import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './VerifyOtp.css';  // Import the new CSS file

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const email = localStorage.getItem("email");
      const { data } = await axios.post("http://localhost:8080/api/users/verify-otp", { email, otp });
      alert(data.message);
      navigate("/login");
    } catch (err) {
      setError(err.response.data.message || "Verification failed");
    }
  };

  return (
    <div className="verify-otp-container">
      <div className="verify-otp-wrapper">
        <h1>Verify OTP</h1>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            value={otp} 
            onChange={(e) => setOtp(e.target.value)} 
            placeholder="Enter OTP" 
            required 
          />
          <button type="submit">Verify</button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
