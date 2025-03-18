import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BoatApproval.css';

const BoatApproval = () => {
  const [pendingBoats, setPendingBoats] = useState([]);

  useEffect(() => {
    // Fetch pending boats from the server
    const fetchPendingBoats = async () => {
      try {
        const response = await axios.get('https://waterway3.onrender.com/api/boats/pending-boats');
        console.log(response.data);  // Log the data structure
        setPendingBoats(response.data);
      } catch (error) {
        console.error('Error fetching pending boats:', error);
      }
    };
    fetchPendingBoats();
  }, []);
  // Approve a boat
  const handleApprove = async (boatId) => {
    try {
      await axios.put(`https://waterway3.onrender.com/api/boats/approve/${boatId}`);
      alert('Boat approved successfully');
      setPendingBoats(pendingBoats.filter(boat => boat._id !== boatId)); // Remove approved boat from list
    } catch (error) {
      console.error('Failed to approve boat', error);
    }
  };

  // Disapprove (delete) a boat
  const handleDisapprove = async (boatId) => {
    try {
      await axios.delete(`https://waterway3.onrender.com/api /boats/disapprove/${boatId}`);
      alert('Boat disapproved and deleted');
      setPendingBoats(pendingBoats.filter(boat => boat._id !== boatId)); // Remove disapproved boat from list
    } catch (error) {
      console.error('Failed to disapprove boat', error);
    }
  };

  return (
    <div className="boat-approval-page">
      <h1>Pending Boat Approvals</h1>
      <div className="pending-boats">
        {pendingBoats.length === 0 ? (
          <p>No boats awaiting approval</p>
        ) : (
          pendingBoats.map(boat => (
            <div key={boat._id} className="boat-item">
              <img
              src={`https://waterway3.onrender.com/uploads/${boat.image}`} // Assuming boat image is saved in an 'uploads' folder on the server
              alt={boat.boatName}
              className="boat-image"
            />
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
                href={`https://waterway3.onrender.com/uploads/${boat.licenseDocument}`} // Link to view license document
                target="_blank"
                rel="noopener noreferrer"
              >
                View License Document
              </a><br></br><br></br>
              <button className="approve-btn" onClick={() => handleApprove(boat._id)}>Approve</button>
              {/* <button className="disapprove-btn" onClick={() => handleDisapprove(boat._id)}>Disapprove</button> */}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BoatApproval;
