import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BoatRegistration.css';
import { useLocation } from 'react-router-dom'; // Import useLocation
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix the marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
});

const BoatRegistration = () => {
  const [boatTypes, setBoatTypes] = useState([]);
  const [formData, setFormData] = useState({
    boatName: '',
    boatType: '',
    description: '',
    price: '',
    priceType: 'perNight',
    licenseNumber: '',
    licenseDocument: null,
    speed: '',
    capacity: '',
    engineType: '',
    status: 'active',
    image: null, // Add pincode field
    pincode: '', // Field for the pincode
    location: { 
      district: '',
      state: '',
      place: '', // Adding place as it was referenced previously
    },
    id: '66d40b4c4be7bfd7e7c12184', // Directly add the id to pass
    ownerId: '66d40b4c4be7bfd7e7c12184', // Directly add the ownerId to pass
    registrationNumber: '',
    registrationDocument: null,
    hasDriver: 'no', // Default to 'no'
    driverDetails: {
      name: '',
      address: '',
      phoneNumber: '',
      licenseNumber: '',
      licenseDocument: null
    }
  });
  const [errors, setErrors] = useState({});
  const [nameAvailable, setNameAvailable] = useState(true);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [offerDescription, setOfferDescription] = useState('');
  const [location, setLocation] = useState('');
  const [finalPrice, setFinalPrice] = useState(0);
  const [postOffices, setPostOffices] = useState([]); 
  // const location = useLocation(); // Get the location object
  const ownerId = location.state?.ownerId; // Extract ownerId from location state
  const [mapCenter, setMapCenter] = useState([9.9312, 76.2673]); // Default to Kerala
  const [selectedLocation, setSelectedLocation] = useState(null);

  const styles = {
    mapSection: {
      marginBottom: '20px',
    },
    mapContainer: {
      border: '1px solid #ddd',
      borderRadius: '5px',
      overflow: 'hidden',
      marginTop: '10px',
    }
  };

  // Function to fetch location data based on postal code using the Indian Postal Pincode API
  const fetchAddressFromPincode = async (pincode) => {
    try {
      const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
      if (response.data && response.data[0] && response.data[0].Status === "Success") {
        const postOfficesList = response.data[0].PostOffice;
        setPostOffices(postOfficesList);
        const place = postOfficesList[0];
        setFormData((prevFormData) => ({
          ...prevFormData,
          location: {
            ...prevFormData.location,
            district: place.District,
            state: place.State,
            place: place.Name || '',
          },
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          pincode: 'Address not found for the given pincode',
        }));
        setPostOffices([]);
      }
    } catch (error) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        pincode: 'Failed to fetch location',
      }));
      setPostOffices([]);
    }
  };

  const handlePincodeChange = async (e) => {
    const { value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      pincode: value
    }));
    if (/^\d{5,6}$/.test(value)) {
      fetchAddressFromPincode(value);
    }
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        try {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          
          if (response.data) {
            const address = response.data.address;
            const place = address.village || address.suburb || address.town || address.city || '';
            const district = address.county || address.state_district || '';
            const state = address.state || '';
            const pincode = address.postcode || '';
            
            setSelectedLocation([lat, lng]);
            setFormData(prev => ({
              ...prev,
              pincode: pincode,
              location: {
                ...prev.location,
                place: place,
                district: district,
                state: state
              }
            }));
          }
        } catch (error) {
          console.error('Error getting address:', error);
        }
      },
    });
    return null;
  };

  useEffect(() => {
    const fetchBoatTypes = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/boats/types');
        setBoatTypes(response.data.filter(type => type.trim() !== '' && type.length > 2));
      } catch (error) {
        console.error('Failed to fetch boat types', error);
      }
    };

    fetchBoatTypes();

    const fetchSessionData = async () => {
      const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
      if (!token) {
        console.error('No token found, user might not be logged in.');
        return;
      }

      try {
        const response = await axios.get('http://localhost:8080/api/auth/sessionn', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          const data = response.data;
          // Setting license number in formData
          setFormData(prevFormData => ({
            ...prevFormData,
            licenseNumber: data.licenseNumber,
          }));
        } else {
          console.error('Failed to fetch session data');
        }
      } catch (error) {
        console.error('Error fetching session data:', error);
      }
    };

    fetchBoatTypes();
    fetchSessionData(); // Fetch the session data to get the license number
  }, []);
   
  // Discount calculation based on the price
  useEffect(() => {
    calculateDiscountedPrice();
  }, [formData.price, discountPercentage]);

  const calculateDiscountedPrice = () => {
    const price = parseFloat(formData.price);  // Ensure price is a number
    if (!isNaN(price) && !isNaN(discountPercentage)) {
      const discountAmount = (price * discountPercentage) / 100;
      const priceAfterDiscount = price - discountAmount;
      setFinalPrice(priceAfterDiscount);
    } else {
      setFinalPrice(0);  // Handle invalid values
    }
  };

  const validateBoatName = (boatName) => {
    const firstChar = boatName.charAt(0);
    if (firstChar === ' ') {
      setErrors(prevErrors => ({ ...prevErrors, boatName: 'The first letter cannot be a space' }));
    
    // Check if the first character is a number
    } else if (!/^[^0-9]/.test(firstChar)) {
      setErrors(prevErrors => ({ ...prevErrors, boatName: 'The boat name cannot start with a number' }));
    } else if (boatName.length > 20) {
      setErrors(prevErrors => ({ ...prevErrors, boatName: 'Boat name should not exceed 20 characters' }));
    
    
    } else {
      setErrors(prevErrors => ({ ...prevErrors, boatName: '' })); // Clear error
    }
  };

  const validateDescription = (description) => {
    const wordCount = description.trim().split(/\s+/).length;
    const charCount = description.length;
  
    // Check if character count is less than 100
    if (charCount < 50) {
      setErrors(prevErrors => ({ ...prevErrors, description: 'Description should be at least 50 characters long' }));
    } 
    // Check if word count exceeds 500 words
    else if (wordCount > 500) {
      setErrors(prevErrors => ({ ...prevErrors, description: 'Description should not exceed 500 words' }));
    } 
    // Clear error if both conditions are met
    else {
      setErrors(prevErrors => ({ ...prevErrors, description: '' }));
    }
  };
  

  const validatePrice = (price) => {
    const priceLimit = 1000000; // ₹10,00,000
    if (!/^\d+$/.test(price)) {
      setErrors(prevErrors => ({ ...prevErrors, price: 'Price must be a valid number' }));
    } else if (price > priceLimit) {
      setErrors(prevErrors => ({ ...prevErrors, price: `Price cannot exceed ₹${priceLimit.toLocaleString()}` }));
    } else {
      setErrors(prevErrors => ({ ...prevErrors, price: '' }));
    }
  };

  const validateSpeed = (speed) => {
    if (isNaN(speed) || speed <= 0 || speed > 600) {
      setErrors(prevErrors => ({ ...prevErrors, speed: 'Speed must be a number between 1 and 600 km/h' }));
    } else {
      setErrors(prevErrors => ({ ...prevErrors, speed: '' }));
    }
  };

  const validateCapacity = (capacity) => {
    if (isNaN(capacity) || capacity <= 0 || capacity > 20) {
      setErrors(prevErrors => ({ ...prevErrors, capacity: 'Capacity must be a number between 1 and 20' }));
    } else {
      setErrors(prevErrors => ({ ...prevErrors, capacity: '' }));
    }
  };

  const validateRegistrationNumber = (number) => {
    if (!/^[A-Z0-9]{5,15}$/.test(number)) {
      setErrors(prevErrors => ({
        ...prevErrors,
        registrationNumber: 'Registration number must be 5-15 characters long and contain only uppercase letters and numbers'
      }));
    } else {
      setErrors(prevErrors => ({ ...prevErrors, registrationNumber: '' }));
    }
  };

  const validatePhoneNumber = (phone) => {
    if (!/^[0-9]{10}$/.test(phone)) {
      setErrors(prevErrors => ({
        ...prevErrors,
        'driverDetails.phoneNumber': 'Phone number must be 10 digits'
      }));
    } else {
      setErrors(prevErrors => ({ ...prevErrors, 'driverDetails.phoneNumber': '' }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];

    if ((name === 'licenseDocument' || name === 'registrationDocument' || name === 'driverDetails.licenseDocument') 
        && file && !file.name.endsWith('.pdf')) {
      setErrors(prevErrors => ({ ...prevErrors, [name]: 'Document must be a PDF' }));
    } else if (name === 'image' && file && !['image/jpeg', 'image/jpg'].includes(file.type)) {
      setErrors(prevErrors => ({ ...prevErrors, [name]: 'Boat image must be in JPG or JPEG format' }));
    } else {
      setErrors(prevErrors => ({ ...prevErrors, [name]: '' }));
      
      if (name.startsWith('driverDetails.')) {
        setFormData(prev => ({
          ...prev,
          driverDetails: {
            ...prev.driverDetails,
            [name.split('.')[1]]: file
          }
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: file }));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('driverDetails.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        driverDetails: {
          ...prev.driverDetails,
          [field]: value
        }
      }));

      if (field === 'phoneNumber') {
        validatePhoneNumber(value);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));

      // Existing validations
      if (name === 'boatName') validateBoatName(value);
      if (name === 'price') validatePrice(value);
      if (name === 'speed') validateSpeed(value);
      if (name === 'capacity') validateCapacity(value);
      if (name === 'description') validateDescription(value);
      if (name === 'registrationNumber') validateRegistrationNumber(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    const token = localStorage.getItem('token');
    
    try {
        // Create location object
        const locationData = {
            place: formData.location.place || '',
            district: formData.location.district || '',
            pincode: formData.pincode || '',
            state: formData.location.state || '',
            country: 'India',
            coordinates: selectedLocation || [8.5241, 76.9366]
        };

        // Create a plain object with all the data
        const requestData = {
            boatName: formData.boatName,
            boatType: formData.boatType,
            description: formData.description,
            price: formData.price,
            priceType: formData.priceType,
            licenseNumber: formData.licenseNumber,
            speed: formData.speed,
            capacity: formData.capacity,
            engineType: formData.engineType || 'inboard',
            status: 'active',
            discountPercentage: discountPercentage || 0,
            location: locationData,
            registrationNumber: formData.registrationNumber,
            hasDriver: formData.hasDriver
        };

        // Add driver details if hasDriver is 'yes'
        if (formData.hasDriver === 'yes') {
            requestData.driverDetails = {
                name: formData.driverDetails.name,
                address: formData.driverDetails.address,
                phoneNumber: formData.driverDetails.phoneNumber,
                licenseNumber: formData.driverDetails.licenseNumber
            };
        }

        // Create FormData and append all fields
        const data = new FormData();
        data.append('data', JSON.stringify(requestData));

        // Append required files
        if (formData.image) {
            data.append('image', formData.image);
        }
        if (formData.licenseDocument) {
            data.append('licenseDocument', formData.licenseDocument);
        }
        if (formData.registrationDocument) {
            data.append('registrationDocument', formData.registrationDocument);
        }
        
        // Append driver's license document if driver exists
        if (formData.hasDriver === 'yes' && formData.driverDetails.licenseDocument) {
            data.append('driverLicenseDocument', formData.driverDetails.licenseDocument); // Changed field name
        }

        // Log the data being sent
        console.log('Sending data:', Object.fromEntries(data.entries()));

        const registerResponse = await axios.post(
            'http://localhost:8080/api/boats/register', 
            data, 
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                }
            }
        );

        console.log('Registration successful:', registerResponse.data);
        alert('Boat added successfully!');
        
    } catch (error) {
        console.error('Detailed error:', error);
        console.error('Error response:', error.response?.data);
        
        const errorMessage = error.response?.data?.message || 'Something went wrong!';
        alert(`Error registering boat: ${errorMessage}`);
    }
};
    return (
    <div className="boat-registration-container">
      <h2>Boat Registration</h2>
      <form onSubmit={handleSubmit} className="boat-registration-form">
        <label>Boat Name:</label>
        <input
          type="text"
          name="boatName"
          value={formData.boatName}
          onChange={handleChange}
          required
        />
        {errors.boatName && <p className="error">{errors.boatName}</p>}

        <label>Boat Type:</label>
        <select name="boatType" value={formData.boatType} onChange={handleChange} required>
          <option value="">Select a type</option>
          {boatTypes.map((boat, index) => (
            <option key={index} value={boat}>
              {boat}
            </option>
          ))}
        </select>

        <label>Description (max 500 words):</label>
        <textarea name="description" value={formData.description} onChange={handleChange} required />
        {errors.description && <p className="error">{errors.description}</p>}

        <div className="price-type">
          <label>Price Type:</label>
          <div>
            <label>
              <input
                type="radio"
                name="priceType"
                value="perNight"
                checked={formData.priceType === 'perNight'}
                onChange={handleChange}
              />
              Per / Night
            </label>
            <label>
              <input
                type="radio"
                name="priceType"
                value="perHead"
                checked={formData.priceType === 'perHead'}
                onChange={handleChange}
              />
              Per / Head
            </label>
          </div>
        </div>

        <label>Price (Rs.):</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          required
        />
        {errors.price && <p className="error">{errors.price}</p>}
        

         {/* Discount */}
         <label>Discount Percentage:</label>
        <input
          type="number"
          value={discountPercentage}
          onChange={(e) => {
            setDiscountPercentage(e.target.value);
            calculateDiscountedPrice();
          }}
          placeholder="Enter discount percentage"
          min="0"
          max="100"
          required
        />

        {/* Final Price */}
        <div>
          <h5>Price: {formData.price}</h5>
          <h5>Discount: {discountPercentage}%</h5>
          <h4>Final Price After Discount: Rs. {finalPrice.toFixed(2)}</h4>
        </div>


        {/* Offer Description
        <label>Offer Description:</label>
        <input
          type="text"
          value={offerDescription}
          onChange={(e) => setOfferDescription(e.target.value)}
          placeholder="Enter offer description"
          required
        /> */}

        
        <label>License Number:</label>
        <input
          type="text"
          name="licenseNumber"
          value={formData.licenseNumber}
          onChange={handleChange}
          readOnly // License number is read-only
          required
        />
        {errors.licenseNumber && <p className="error">{errors.licenseNumber}</p>}

        <label>Upload License Document (PDF):</label>
        <input type="file" name="licenseDocument" onChange={handleFileChange} accept="application/pdf" required />
        {errors.licenseDocument && <p className="error">{errors.licenseDocument}</p>}
        
        
        <label>Place:</label>
<input
  type="text"
  value={formData.location.place} // Assuming you have a 'place' field in formData.location
  onChange={(e) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      location: {
        ...prevFormData.location,
        place: e.target.value, // Update the place directly
      },
    }));
  }} // Update this to handle the input change
  placeholder="Enter the place"
  required
/>

       {/* Pincode Field */}
<label>Pincode:</label>
<input
  type="text"
  name="pincode"
  value={formData.pincode}
  onChange={handlePincodeChange} // Handle input change and trigger pincode fetch
  required
  placeholder="Enter Pincode"
/>
{/* Display error if the pincode is invalid */}
{errors.pincode && <p className="error">{errors.pincode}</p>}



<label>District:</label>
<input 
  type="text" 
  name="district" 
  value={formData.location.district} 
  readOnly // Make it read-only or editable based on your requirements
/>

<label>State:</label>
<input 
  type="text" 
  name="state" 
  value={formData.location.state} 
  readOnly // Make it read-only or editable based on your requirements
/>


        <label>Speed (km/h):</label>
        <input type="number" name="speed" value={formData.speed} onChange={handleChange} required />
        {errors.speed && <p className="error">{errors.speed}</p>}

        <label>Capacity (persons):</label>
        <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} required />
        {errors.capacity && <p className="error">{errors.capacity}</p>}

        <label>Engine Type:</label>
        <select name="engineType" value={formData.engineType} onChange={handleChange} required>
          <option value="inboard">Inboard</option>
          <option value="outboard">Outboard</option>
          <option value="jetDrive">Jet Drive</option>
        </select>

        {/* ,br<label>Status:</label>
        <select name="status" value={formData.status} onChange={handleChange} required>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select> */}

        <label>Boat Image (JPG/JPEG):</label>
        <input type="file" name="image" onChange={handleFileChange} accept="image/jpeg, image/jpg" required />
        {errors.image && <p className="error">{errors.image}</p>}
        <br></br>

        <label>Boat Registration Number:</label>
        <input
          type="text"
          name="registrationNumber"
          value={formData.registrationNumber}
          onChange={handleChange}
          placeholder="Enter boat registration number"
          required
        />
        {errors.registrationNumber && <p className="error">{errors.registrationNumber}</p>}

        <label>Registration Document (PDF):</label>
        <input 
          type="file" 
          name="registrationDocument" 
          onChange={handleFileChange}
          accept="application/pdf"
          required
        />
        {errors.registrationDocument && <p className="error">{errors.registrationDocument}</p>}

        <label>Do you have a driver?</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="hasDriver"
              value="yes"
              checked={formData.hasDriver === 'yes'}
              onChange={(e) => setFormData(prev => ({ ...prev, hasDriver: e.target.value }))}
            />
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="hasDriver"
              value="no"
              checked={formData.hasDriver === 'no'}
              onChange={(e) => setFormData(prev => ({ ...prev, hasDriver: e.target.value }))}
            />
            No
          </label>
        </div>

        {formData.hasDriver === 'yes' && (
          <div className="driver-details">
            <h3>Driver Details</h3>
            
            <label>Driver Name:</label>
            <input
              type="text"
              name="driverDetails.name"
              value={formData.driverDetails.name}
              onChange={handleChange}
              required
            />

            <label>Driver Address:</label>
            <textarea
              name="driverDetails.address"
              value={formData.driverDetails.address}
              onChange={handleChange}
              required
            />

            <label>Driver Phone Number:</label>
            <input
              type="tel"
              name="driverDetails.phoneNumber"
              value={formData.driverDetails.phoneNumber}
              onChange={handleChange}
              pattern="[0-9]{10}"
              required
            />
            {errors['driverDetails.phoneNumber'] && (
              <p className="error">{errors['driverDetails.phoneNumber']}</p>
            )}

            <label>Driver License Number:</label>
            <input
              type="text"
              name="driverDetails.licenseNumber"
              value={formData.driverDetails.licenseNumber}
              onChange={handleChange}
              required
            />

            <label>Driver License Document (PDF):</label>
            <input
              type="file"
              name="driverDetails.licenseDocument"
              onChange={handleFileChange}
              accept="application/pdf"
              required
            />
            {errors['driverDetails.licenseDocument'] && (
              <p className="error">{errors['driverDetails.licenseDocument']}</p>
            )}
          </div>
        )}

        {/* Add this after your location input fields */}
        <div style={styles.mapSection}>
          <label>Select Location on Map:</label>
          <div style={styles.mapContainer}>
            <MapContainer
              center={mapCenter}
              zoom={8}
              style={{ height: '400px', width: '100%', marginBottom: '20px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {selectedLocation && (
                <Marker position={selectedLocation}>
                  <Popup>
                    {formData.location.place}, {formData.location.district}, {formData.pincode}, {formData.location.state} India
                  </Popup>
                </Marker>
              )}
              <MapClickHandler />
            </MapContainer>
          </div>
        </div>

        <br></br><button type="submit" className="submit-btn">Add Boat</button>
      </form>
    </div>
  );
};

export default BoatRegistration;
