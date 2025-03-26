import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditBoat = ({ boat, onUpdate, onClose }) => {
  const [formData, setFormData] = useState({ ...boat });
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    // Set the initial image preview
    if (boat.image) {
      setImagePreview(`http://localhost:8080/uploads/${boat.image}`); // Update this path as needed
    }
  }, [boat]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file); // Get the selected file

    // Create a preview URL for the selected file
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(`http://localhost:8080/uploads/${boat.image}`); // Reset to current image if no file selected
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSubmit = new FormData();

    // Append all fields to FormData
    Object.keys(formData).forEach(key => {
      formDataToSubmit.append(key, formData[key]);
    });

    // If there's a new image, append it as well
    if (selectedFile) {
      formDataToSubmit.append('image', selectedFile);
    }

    try {
      const response = await axios.put(`http://localhost:8080/api/boats/boatsd/${boat._id}`, formDataToSubmit, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file uploads
        },
      });
      onUpdate(response.data);
      onClose(); // Close the edit form
    } catch (error) {
      console.error('Error updating boat:', error);
    }
  };

  return (
    <div>
      <h2>Edit Boat</h2>
      <form onSubmit={handleSubmit}>
        <label>Boat Name:</label>
        <input type="text" name="boatName" value={formData.boatName} onChange={handleChange} required />

        <label>Boat Type:</label>
        <input type="text" name="boatType" value={formData.boatType} onChange={handleChange} required />

        <label>Description:</label>
        <textarea name="description" value={formData.description} onChange={handleChange} required />

        <label>Price:</label>
        <input type="number" name="price" value={formData.price} onChange={handleChange} required />

        <label>Capacity:</label>
        <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} required />

        <label>Current Image:</label>
        {imagePreview && (
          <img src={imagePreview} alt="Boat" style={{ width: '100%', height: 'auto', marginBottom: '10px' }} />
        )}

        <label>Change Image:</label>
        <input type="file" name="image" accept="image/*" onChange={handleFileChange} />

        <button type="submit">Update Boat</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
};

export default EditBoat;
