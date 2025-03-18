import React, { useEffect, useState } from 'react';
import { useParams, useNavigate  } from 'react-router-dom';
import axios from 'axios';

const SearchResults = () => {
  const { query } = useParams(); // Extract the search query from the URL
  const [filteredBoats, setFilteredBoats] = useState([]);
  const navigate = useNavigate(); 
  // Fetch boats when the component mounts and filter based on the query
  const fetchFilteredBoats = async () => {
    try {
      const response = await axios.get("https://waterway3.onrender.com/api/boats/boatsd"); // Fetch all boats
      const boats = response.data;

      // Filter boats based on the search query
      const filtered = boats.filter(
        (boat) =>
          (boat.boatName && boat.boatName.toLowerCase().includes(query.toLowerCase())) ||
          (boat.boatType && boat.boatType.toLowerCase().includes(query.toLowerCase())) ||
          (boat.description && boat.description.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredBoats(filtered);

      if (filtered.length === 0) {
        navigate(-1); // Navigate to the previous page
      }
    } catch (error) {
      console.error("Error fetching boats:", error);
    }
  };

  useEffect(() => {
    fetchFilteredBoats(); // Fetch boats when the component mounts
  }, [query]);


  const handleBookNow = (boat) => {
    // Assuming userDetails is a state or prop that should be passed to this component
    // If userDetails is not defined, it should be handled or passed correctly
    // For demonstration, let's assume userDetails is a prop passed to this component
    const userDetails = { id: '66f2e38cf3439033d7d918cc', name: 'alen', email: 'alenvarghese2025@mca.ajce.in' }; // Example userDetails
    navigate('/userint/boatviewdetails', { 
      state: { 
        boat, 
        userDetails: {
          id: userDetails.id,
          name: userDetails.name,
          email: userDetails.email
        }
      } 
    });;
  };


  return (
    <div>
      <h2>Search Results for "{query}"</h2>
      <div className="boat-search-results">
        {filteredBoats.length > 0 ? (
          filteredBoats.map((boat) => (
            <div key={boat._id} className="boat-card">
              <img
                src={`https://waterway3.onrender.com/uploads/${boat.image}`}
                alt={boat.boatName}
                className="boat-image"
              />
              <h3>{boat.boatName}</h3>
              <p><strong>Type:</strong> {boat.boatType}</p>
              <p><strong>Price:</strong> Rs. {boat.price}</p>
              <p><strong>Description:</strong> {boat.description}</p>
              <p><strong>Capacity:</strong> {boat.capacity} people</p>
              <p><strong>Speed:</strong> {boat.speed} km/h</p>
              <button className="book-button" onClick={() => handleBookNow(boat)}>Book Now</button>
            </div>
          ))
        ) : (
          <p>No boats found matching your search.</p>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
