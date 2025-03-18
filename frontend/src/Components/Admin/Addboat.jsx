import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './addboat.css'; // Import the CSS file

const Addboat = () => {
  const [boatType, setBoatType] = useState('');
  const [boats, setBoats] = useState([]);  // Store all boat types
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editBoatId, setEditBoatId] = useState(null);



  const validateBoatType = (type) => {
    const regex = /^[A-Za-z\s]{4,}$/; // Allows letters and spaces only, min 4 characters
    return regex.test(type) && !/\d/.test(type); // No numbers
  };

  // Fetch existing boat types when component mounts
  useEffect(() => {
    const fetchBoats = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/boats/types');
        console.log('Fetched boat types:', response.data);
        setBoats(response.data);
      } catch (error) {
        console.error('Failed to fetch boat types', error);
      }
    };

    fetchBoats();
  }, []);

  // Add or Edit boat type based on state
  const handleAddOrEditBoat = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedBoatType = boatType.trim(); // Remove spaces


    if (!validateBoatType(trimmedBoatType)) {
      setError('Invalid boat type. It should be at least 4 characters long, contain only letters, and no numbers or spaces.');
      return;
    }
    // Check if the boat type already exists
    if (!isEditing && boats.includes(trimmedBoatType)) {
      setError('Boat type already exists');
      return;
    }

    try {
      if (isEditing) {
        // Edit existing boat type
        await axios.put(`http://localhost:8080/api/boats/${editBoatId}`, {
          type: trimmedBoatType,
        });
        setBoats((prevBoats) =>
          prevBoats.map((boat) =>
            boat._id === editBoatId ? { ...boat, type: trimmedBoatType } : boat
          )
        );
        setIsEditing(false);
        setEditBoatId(null);
      } else {
        // Add new boat type
        const response = await axios.post('http://localhost:8080/api/boats', {
          type: trimmedBoatType,
        });

        // Update boats state with the newly added boat
        setBoats((prevBoats) => [...prevBoats, response.data.type]);
      }
      setBoatType(''); // Clear input field
    } catch (error) {
      console.error('Failed to add or edit boat', error);
      setError('Failed to add or edit boat');
    }
  };

  // Delete a boat type
  // Delete a boat type
  const handleDeleteBoat = async (id) => {
    try {
      console.log('Deleting boat with ID:', id); // Log the ID being passed
      await axios.delete(`http://localhost:8080/api/boats/boatsde/${id}`);
      // Handle successful deletion, e.g., update state
    } catch (error) {
      console.error('Failed to delete boat', error); // Log the error
    }
  };



  // Populate form for editing
  const handleEditBoat = (boatType, boatId) => {
    setBoatType(boatType);
    setEditBoatId(boatId);  // Set the boat's ID for editing
    setIsEditing(true);
  };

  return (
    <div className="add-boat-container">
      <h2>{isEditing ? 'Edit Boat Type' : 'Add Boat Type'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display error message */}

      <form onSubmit={handleAddOrEditBoat}>
        <input
          type="text"
          placeholder="Boat Type"
          value={boatType}
          onChange={(e) => setBoatType(e.target.value)}
          required
        />
        <button type="submit">{isEditing ? 'Update Boat Type' : 'Add Boat Type'}</button>
      </form>

      <h3>Existing Boat Types</h3>
      <ul>
  {boats.length > 0 ? (
    boats.map((boat) => {
      console.log(boat); // Log the boat object to check its structure
      return (
        <li key={boat._id}>
          {boat} {/* Display the boat type */}
          &nbsp;
          <div className="bu">
            {/* <button onClick={() => handleEditBoat(boat.type, boat._id)}>Edit</button> */}
            {/* Check if boat._id exists */}
            <button className="button delete" onClick={() => handleDeleteBoat(boat._id)}></button>
          </div>
        </li>
      );
    })
  ) : (
    <p>No boat types available.</p>
  )}
</ul>


    </div>
  );
};

export default Addboat;












