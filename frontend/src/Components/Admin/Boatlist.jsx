import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BoatList.css'; // Optional: create a separate CSS file for styling

const Boatlist = () => {
  const [boats, setBoats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch registered boats from the backend
  useEffect(() => {
    const fetchBoats = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/boats/boatsd');
        setBoats(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch boats:', error);
        setLoading(false);
      }
    };

    fetchBoats();
  }, []);

  if (loading) {
    return <p>Loading boats...</p>;
  }

  if (boats.length === 0) {
    return <p>No boats registered yet.</p>;
  }

  return (
    <div className="boat-list-container">
      <h2>Registered Boats</h2>
      <div className="boat-list">
        {boats.map((boat) => (
          <div key={boat._id} className="boat-card">
            <img
              src={`http://localhost:8080/uploads/${boat.image}`} // Assuming boat image is saved in an 'uploads' folder on the server
              alt={boat.boatName}
              className="boat-image"
            />
            <div className="boat-details">    
              <h3>{boat.boatName}</h3>
              <p><strong>Type:</strong> {boat.boatType}</p>
              <div className="dcontainer">
    <p>Description: {boat.description}</p>
</div>
              <p><strong>Price:</strong> Rs. {boat.price}  {boat.priceType}</p>
              <p><strong>Speed:</strong> {boat.speed} km/h</p>
              <p><strong>Capacity:</strong> {boat.capacity} people</p>
              <p><strong>Engine Type:</strong> {boat.engineType}</p>
              <p><strong>Status:</strong> {boat.status}</p>
              <p><strong>License Number:</strong> {boat.licenseNumber}</p>
              <a
                href={`http://localhost:8080/uploads/${boat.licenseDocument}`} // Link to view license document
                target="_blank"
                rel="noopener noreferrer"
              >
                View License Document
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Boatlist;
