import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom'; // Import useNavigate and useParams

const EditUser = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate(); // Initialize navigate
  const { id: userId } = useParams(); // Extract userId from URL parameters

  useEffect(() => {
    // Fetch user details when the component loads
    const fetchUser = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/auth/users/${userId}`);
        setName(response.data.name);
        setEmail(response.data.email);
      } catch (error) {
        console.error('Failed to fetch user', error);
        setError('Failed to fetch user details');
      }
    };
    fetchUser();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:8080/api/auth/users/${userId}`, { name, email });
      setSuccess('User updated successfully');
      navigate('/admin/viewusers');  // Redirect back to View Users after updating
    } catch (error) {
        if (error.response && error.response.data.message) {
            // Display any error message returned from the backend
            setError(error.response.data.message);
        } else {
            // Generic error message for any other issues
            setError('Failed to update user');
        }
    }
};


  return (
    <div>
      <h2>Edit User</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit">Update User</button>
      </form>
    </div>
  );
};

export default EditUser;
