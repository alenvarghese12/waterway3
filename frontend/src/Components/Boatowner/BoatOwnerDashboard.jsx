import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Assuming you're using axios for API requests
import './BoatOwnerDashboard.css'; // Import a CSS file for styling



const BoatOwnerDashboard = () => {
    const [boats, setBoats] = useState([]);
    const [ownerName, setOwnerName] = useState(''); // Store boat owner's name

    useEffect(() => {
        // Fetch registered boat details and boat owner name (assuming backend API available)
        axios.get('/api/boat-owner/dashboard')
            .then(response => {
                setBoats(response.data.boats);
                setOwnerName(response.data.ownerName);
            })
            .catch(error => console.error('Error fetching boat details:', error));
    }, []);

    return (
        <div className="boat-owner-dashboard">
            <header className="welcome-message">
                <h1>Welcome, {ownerName}!</h1>
            </header>

            <section className="registered-boats-section">
                <h2>Your Registered Boats</h2>
                {boats.length > 0 ? (
                    <ul className="boat-list">
                        {boats.map(boat => (
                            <li key={boat._id} className="boat-item">
                                <h3>{boat.name}</h3>
                                <p><strong>Type:</strong> {boat.type}</p>
                                <p><strong>Description:</strong> {boat.description}</p>
                                <p><strong>Capacity:</strong> {boat.capacity}</p>
                                <p><strong>Status:</strong> {boat.status}</p>
                                <p><strong>License Number:</strong> {boat.licenseNumber}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No boats registered yet.</p>
                )}
            </section>
        </div>
    );
};

export default BoatOwnerDashboard;
