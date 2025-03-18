import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddFoodItem = () => {
  const [foodItem, setFoodItem] = useState({
    name: '',
    description: '',
    price: '',
    category: 'breakfast', // Changed default category
    customizations: {
      salt: false,
      pepper: false,
      chili: false,
    },
  });
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [boatOwnerId, setBoatOwnerId] = useState(null);

  // Fetch boat owner ID when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }

        const response = await axios.get('https://waterway3.onrender.com/api/auth/user-data', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data && (response.data._id || response.data.id)) {
          setBoatOwnerId(response.data._id || response.data.id);
        } else {
          throw new Error('Invalid user data received');
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Server response error:', error.response.data);
          throw new Error(error.response.data.message || 'Failed to fetch user data');
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
          throw new Error('No response from server');
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Request setup error:', error.message);
          throw new Error('Error setting up the request');
        }
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFoodItem((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCustomizationChange = (customization) => {
    setFoodItem((prev) => ({
      ...prev,
      customizations: {
        ...prev.customizations,
        [customization]: !prev.customizations[customization],
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!boatOwnerId) {
        throw new Error('Please wait while we fetch your data');
      }

      // Validate required fields
      if (!foodItem.name || !foodItem.description || !foodItem.price || !foodItem.category) {
        throw new Error('Please fill in all required fields');
      }

      const formData = new FormData();
      
      // Add basic fields
      formData.append('name', foodItem.name.trim());
      formData.append('description', foodItem.description.trim());
      formData.append('price', Number(foodItem.price));
      formData.append('category', foodItem.category);
      formData.append('boatOwnerId', boatOwnerId);
      
      // Add customizations as a string
      const customizationsString = JSON.stringify(foodItem.customizations);
      formData.append('customizations', customizationsString);
      
      // Add image if exists
      if (image) {
        formData.append('image', image);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Log the form data for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await axios.post('https://waterway3.onrender.com/api/food/food-items', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 201) {
        alert('Food item added successfully');
        // Reset form
        setFoodItem({
          name: '',
          description: '',
          price: '',
          category: 'breakfast',
          customizations: {
            salt: false,
            pepper: false,
            chili: false,
          }
        });
        setImage(null);
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'Failed to add food item';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server response error:', error.response.data);
        errorMessage = error.response.data.message || error.response.data.error || 'Server error occurred';
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorMessage = 'No response from server';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2 style={styles.title}>Add Food Item</h2>
      
      <div style={styles.imageUpload}>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={styles.fileInput}
          id="image-upload"
        />
        <label htmlFor="image-upload" style={styles.uploadLabel}>
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" style={styles.preview} />
          ) : (
            <div style={styles.uploadPlaceholder}>
              <span>Click to upload image</span>
            </div>
          )}
        </label>
      </div>

      <div style={styles.inputGroup}>
        <input
          id='foodname'
          type="text"
          name="name"
          placeholder="Food Name"
          value={foodItem.name}
          onChange={handleChange}
          required
          style={styles.input}
        />
      </div>

      <div style={styles.inputGroup}>
        <textarea
          id='fooddescription'
          name="description"
          placeholder="Description"
          value={foodItem.description}
          onChange={handleChange}
          required
          style={styles.textarea}
        />
      </div>

      <div style={styles.inputGroup}>
        <input
          id='foodprice'
          type="number"
          name="price"
          placeholder="Price"
          value={foodItem.price}
          onChange={handleChange}
          required
          style={styles.input}
        />
      </div>

      <div style={styles.inputGroup}>
        <select 
          id='foodcategory'
          name="category" 
          value={foodItem.category} 
          onChange={handleChange}
          style={styles.select}
        >
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="fresh_juice">Fresh Juice</option>
          <option value="soft_drinks">Soft Drinks</option>
        </select>
      </div>

      {/* <div style={styles.customizations}>
        <h3>Customizations</h3>
        <div style={styles.checkboxGroup}>
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={foodItem.customizations.salt}
              onChange={() => handleCustomizationChange('salt')}
            />
            Salt
          </label>
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={foodItem.customizations.pepper}
              onChange={() => handleCustomizationChange('pepper')}
            />
            Pepper
          </label>
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={foodItem.customizations.chili}
              onChange={() => handleCustomizationChange('chili')}
            />
            Chili
          </label>
        </div>
      </div> */}

      <button type="submit" id='addfooditem' style={styles.submitButton}>
        Add Food Item
      </button>
    </form>
  );
};

const styles = {
  form: {
    width: '600px',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px',
  },
  imageUpload: {
    marginBottom: '20px',
  },
  fileInput: {
    display: 'none',
  },
  uploadLabel: {
    display: 'block',
    width: '100%',
    height: '200px',
    border: '2px dashed #ccc',
    borderRadius: '8px',
    cursor: 'pointer',
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  uploadPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
  },
  inputGroup: {
    marginBottom: '15px',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    minHeight: '100px',
    resize: 'vertical',
  },
  select: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
  },
  customizations: {
    marginBottom: '20px',
  },
  checkboxGroup: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer',
  },
  submitButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'black',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    '&:hover': {
      backgroundColor: '#45a049',
    }
  },
};

export default AddFoodItem;