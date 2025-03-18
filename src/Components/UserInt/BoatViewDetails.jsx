import React, { useState, useEffect } from 'react';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import Razorpay from 'razorpay'; // Import Razorpay library for payment
import { useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate
import axios from 'axios';
import backbutton from '../Assets/back-button.png';
import forwardbutton from '../Assets/forward-button.png';
import payment from '../Assets/secure-payment.png';
import ChatComponent from '../UserInt/ChatComponent';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

const BoatViewDetails = () => {
  const location = useLocation();
  const navigate = useNavigate(); // Create navigate function

  const { boat = {}, userDetails = {} } = location.state || {};
  const [currentStep, setCurrentStep] = useState(1); // Step control for multi-step booking
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    },
  ]);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [error, setError] = useState('');
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [userData, setUserData] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState({
    phone: '',
    address: '',
  });
  const [selectedFoodItems, setSelectedFoodItems] = useState(
    location.state?.selectedFoodItems || {}
  );
  const [foodItems, setFoodItems] = useState([]);
  const [activeSection, setActiveSection] = useState('Overview');
  const [amenitiesData, setAmenitiesData] = useState([]);
  const [overviewData, setOverviewData] = useState({
    description: '',
    aboutProperty: '',
    propertyHighlights: [],
    images: []
  });

  useEffect(() => {
    if (userDetails?.name) {
      setUserData(prevData => ({ ...prevData, name: userDetails.name }));
    }
    if (location.state?.selectedFoodItems) {
      setSelectedFoodItems(location.state.selectedFoodItems);
    }
  }, [userDetails, location.state]);

  useEffect(() => {
    const fetchFoodItems = async () => {
      try {
        if (boat && boat.ownerId) {
          const response = await axios.get(`http://localhost:8080/api/food/food-items/${boat.ownerId}`);
          setFoodItems(response.data);
        }
      } catch (error) {
        console.error('Error fetching food items:', error);
      }
    };

    fetchFoodItems();
  }, [boat]);

  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        if (boat && boat._id) {
          // Get token from localStorage
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `http://localhost:8080/api/boats/boatsdg/${boat._id}/amenities`,
            {
              headers: {
                'Authorization': `Bearer ${token}` // Add authorization header
              }
            }
          );
          if (response.data && response.data.amenities) {
            setAmenitiesData(response.data.amenities);
            console.log('Fetched amenities:', response.data.amenities);
          }
        }
      } catch (error) {
        console.error('Error fetching amenities:', error);
        setAmenitiesData([]); // Set empty array on error
      }
    };

    fetchAmenities();
  }, [boat]);

  useEffect(() => {
    const fetchUnavailableDates = async () => {
      try {
        if (boat && boat._id) {
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `http://localhost:8080/api/boats/${boat._id}/unavailable-dates`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          if (response.data) {
            setUnavailableDates(response.data);
          } else {
            setUnavailableDates([]); // Set empty array if no data
          }
        }
      } catch (error) {
        console.error('Error fetching unavailable dates:', error);
        setUnavailableDates([]); // Set empty array on error
      }
    };

    fetchUnavailableDates();
  }, [boat]);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        if (boat && boat._id) {
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `http://localhost:8080/api/overview/${boat._id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          if (response.data && !response.data.message) {
            setOverviewData(response.data);
          } else {
            // Set default values if no overview found
            setOverviewData({
              description: boat.description || '',
              aboutProperty: 'Welcome to our beautiful property',
              propertyHighlights: [],
              images: boat.image ? [boat.image] : []
            });
          }
        }
      } catch (error) {
        console.error('Error fetching overview data:', error);
        // Set default values on error
        setOverviewData({
          description: boat.description || '',
          aboutProperty: 'Welcome to our beautiful property',
          propertyHighlights: [],
          images: boat.image ? [boat.image] : []
        });
      }
    };

    fetchOverviewData();
  }, [boat]);

  const handleSelectFood = () => {
    navigate('/userint/food-selection', {
      state: {
        ownerId: boat.ownerId,
        selectedFoodItems: selectedFoodItems,
        boat: boat,
        userDetails: userDetails,
      },
    });
  };

  const steps = ["Your selection", "Your details", "Final step"];

  const handleNextStep = () => {
    // Check if we are moving to step 2 (user details) or step 3 (payment)
    if (currentStep === 1) {
      // Validate date selection
      const numberOfDays = Math.ceil((dateRange[0].endDate - dateRange[0].startDate) / (1000 * 60 * 60 * 24)) + 1; // Calculate the number of days and add 1
      if (numberOfDays < 1) {
        alert('Please select at least one day for booking.'); // Alert for invalid date selection
        return;
      }
      if (numberOfDays % 2 !== 0) {
        alert('Please select an even number of days for booking.'); // Alert for odd day selection
        return;
      }
      // If moving to step 2, just proceed
      setCurrentStep((prevStep) => prevStep + 1);
    } else if (currentStep === 2) {
      // If moving to step 3, validate phone number and address
      if (validatePhoneNumber(userData.phone) && validateAddress(userData.address)) {
        setCurrentStep((prevStep) => prevStep + 1);
      } else {
        alert('Please enter a valid phone number and address.'); // Alert for invalid inputs
      }
    }
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[0-9]{10}$/; // Ensure phone number is exactly 10 digits
    return phoneRegex.test(phone);
  };

  const validateAddress = (address) => {
    const addressRegex = /^[^\s0-9][A-Za-z0-9\s]*$/; // Ensure address does not start with a space or number
    return addressRegex.test(address);
  };

  const handlePreviousStep = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Set and validate phone and address fields
    if (name === 'phone') {
      const phoneRegex = /^[0-9]{0,10}$/;
      if (phoneRegex.test(value)) {
        setUserData((prevData) => ({ ...prevData, phone: value }));
        setErrors((prevErrors) => ({ ...prevErrors, phone: '' }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          phone: 'Phone number must be 10 digits without spaces or special characters',
        }));
      }
    } else if (name === 'address') {
      const addressRegex = /^[^\s0-9][A-Za-z0-9\s]*$/;
      if (addressRegex.test(value)) {
        setUserData((prevData) => ({ ...prevData, address: value }));
        setErrors((prevErrors) => ({ ...prevErrors, address: '' }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          address: 'Address must not start with a space or number',
        }));
      }
    } else {
      setUserData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  const handleRazorpayPayment = async () => {
    try {
      // Validate required fields before proceeding
      if (!adults || adults < 1) {
        alert('At least one adult passenger is required');
        return;
      }

      if (!dateRange[0].startDate || !dateRange[0].endDate) {
        alert('Please select valid dates');
        return;
      }

      let boatCost;
      if (boat.priceType === 'perHead') {
        boatCost = boat.price * adults;
      } else if (boat.priceType === 'perNight') {
        const numberOfDays = Math.ceil((dateRange[0].endDate - dateRange[0].startDate) / (1000 * 60 * 60 * 24));
        boatCost = boat.price * Math.max(1, numberOfDays);
      }

      const foodCost = location.state?.totalFoodAmount || 0;
      const totalAmount = boatCost + foodCost;

      const options = {
        key: 'rzp_test_shlMZZixePYp01',
        amount: totalAmount * 100,
        currency: 'INR',
        name: 'Boat Booking',
        description: `Booking for ${boat.boatName}`,
        handler: async (response) => {
          try {
            const paymentDetails = {
              boatId: boat._id,
              userId: userDetails.id,
              startDate: dateRange[0].startDate,
              endDate: dateRange[0].endDate,
              passengers: {
                adults: adults,
                children: children || 0
              },
              paymentId: response.razorpay_payment_id,
              name: userData.name,
              email: userDetails.email,
              phone: userData.phone,
              address: userData.address,
              totalAmount: totalAmount,
              boatName: boat.boatName,
              boatImage: boat.image,
              location: {
                place: boat.location?.place || '',
                district: boat.location?.district || '',
                pincode: boat.location?.pincode || '',
                state: boat.location?.state || '',
                coordinates: boat.location?.coordinates || []
              }
            };

            console.log('Sending booking data:', paymentDetails);

            const bookingResponse = await fetch('http://localhost:8080/api/bookings/bookingss', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(paymentDetails),
            });

            if (!bookingResponse.ok) {
              const errorData = await bookingResponse.json();
              throw new Error(`Booking failed: ${JSON.stringify(errorData)}`);
            }

            const responseData = await bookingResponse.json();
            console.log('Booking response:', responseData);
            alert('Booking successful! An email will be sent with the booking details.');
            navigate('/userint/userboatl');
          } catch (error) {
            console.error('Error processing payment:', error);
            alert(`An error occurred while processing your payment: ${error.message}`);
          }
        },
        prefill: {
          name: userData.name,
          email: userDetails.email,
          contact: userData.phone,
        },
        theme: {
          color: '#F37254',
        },
      };

      // Create and open Razorpay
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Error in handleRazorpayPayment:', error);
      alert('Error processing payment. Please try again.');
    }
  };

  const handleFoodQuantityChange = (foodId, change) => {
    setSelectedFoodItems(prev => {
      const currentQuantity = prev[foodId]?.quantity || 0;
      const newQuantity = Math.max(0, currentQuantity + change);
      
      if (newQuantity === 0) {
        const { [foodId]: removed, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [foodId]: {
          ...prev[foodId],
          quantity: newQuantity
        }
      };
    });
  };

  const handleFoodSelection = (foodId) => {
    setSelectedFoodItems(prev => ({
      ...prev,
      [foodId]: {
        quantity: (prev[foodId]?.quantity || 0) + 1,
        customizations: prev[foodId]?.customizations || {}
      }
    }));
  };

  const handleCustomize = (foodItem) => {
    setCurrentFoodItem(foodItem);
    setShowCustomizeModal(true);
  };

  const handleCustomizationChange = (foodId, customization) => {
    setSelectedFoodItems(prev => ({
      ...prev,
      [foodId]: {
        ...prev[foodId],
        customizations: {
          ...prev[foodId]?.customizations,
          [customization]: !prev[foodId]?.customizations[customization]
        }
      }
    }));
  };

  const handleQuantityChange = (foodId, change) => {
    setSelectedFoodItems(prev => {
      const currentQuantity = prev[foodId]?.quantity || 0;
      const newQuantity = Math.max(0, currentQuantity + change);
      
      if (newQuantity === 0) {
        const { [foodId]: removed, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [foodId]: {
          ...prev[foodId],
          quantity: newQuantity
        }
      };
    });
  };

  const validateCapacity = (newAdults, newChildren) => {
    const totalPassengers = Number(newAdults) + Number(newChildren);
    if (totalPassengers > boat.capacity) {
      setError(`Total passengers cannot exceed boat capacity of ${boat.capacity}`);
      return false;
    }
    setError('');
    return true;
  };

  const handleAdultsChange = (value) => {
    const newValue = Math.max(0, parseInt(value));
    if (validateCapacity(newValue, children)) {
      setAdults(newValue);
    }
  };

  const handleChildrenChange = (value) => {
    const newValue = Math.max(0, parseInt(value));
    if (validateCapacity(adults, newValue)) {
      setChildren(newValue);
    }
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <div style={styles.stepsContainer}>
      {steps.map((step, index) => (
        <div key={index} style={styles.stepWrapper}>
          <div
            style={{
              ...styles.stepCircle,
              backgroundColor: currentStep === index + 1 ? '#007BFF' : '#ccc',
              color: currentStep === index + 1 ? 'white' : 'black',
            }}
          >
            {index + 1}
          </div>
          <p
            style={{
              ...styles.stepLabel,
              fontWeight: currentStep === index + 1 ? 'bold' : 'normal',
            }}
          >
            {step}
          </p>
          {index < steps.length - 1 && <div style={styles.stepLine}></div>}
        </div>
      ))}
    </div>
  );

  // Conditionally render the content for each step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div id="over" style={styles.over}>
            {/* <div style={navbarStyles.navbar}>
              {['Overview', 'Amenities', 'Property Policies', 'Select Food', 'Security'].map((section) => (
                <button
                  key={section}
                  style={{
                    ...navbarStyles.navButton,
                    ...(activeSection === section ? navbarStyles.navButton['&.active'] : {})
                  }}
                  onClick={() => {
                    setActiveSection(section);
                    const element = document.getElementById(section.toLowerCase().replace(' ', '-'));
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  {section}
                </button>
              ))}
            </div> */}

            <div id="overview" style={styles.overviewSection}>
              <div style={styles.overviewHeader}>
                <h2 style={styles.boatName}>{boat.boatName}</h2>
                <div style={styles.ratingLocation}>
                  <div style={styles.location}>
                    <span>📍 {boat.location?.place}, {boat.location?.district}</span>
                  </div>
                </div>
              </div>

              <div style={styles.imageGallery}>
                <div style={styles.mainImageContainer}>
                  <img
                    src={boat.image ? `http://localhost:8080/uploads/${boat.image}` : 'default-image-url.jpg'}
                    alt={boat.boatName}
                    style={styles.mainImage}
                  />
                </div>
                <div style={styles.thumbnailGrid}>
                  {overviewData.images.slice(0, 4).map((image, index) => (
                    <div key={index} style={styles.thumbnailWrapper}>
                      {/* <img
                        src={`http://localhost:8080/uploads/${image}`}
                        alt={`${boat.boatName} view ${index + 1}`}
                        style={styles.thumbnailImage}
                      /> */}
                      {index === 3 && overviewData.images.length > 4 && (
                        <div style={styles.morePhotosOverlay}>
                          +{overviewData.images.length - 4} photos
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.overviewContent}>
                <div style={styles.descriptionSection}>
                  <h3 style={styles.sectionTitle}>About this property</h3>
                  <p style={styles.description}>{overviewData.aboutProperty}</p>
                  <p style={styles.description}>{overviewData.description}</p>
                </div>

                <div style={styles.highlightsSection}>
                  <h3 style={styles.sectionTitle}>Property Highlights</h3>
                  <div style={styles.highlightsGrid}>
                    {overviewData.propertyHighlights.map((highlight, index) => (
                      <div key={index} style={styles.highlightBox}>
                        <h4 style={styles.highlightTitle}>{highlight.title}</h4>
                        <p style={styles.highlightDescription}>{highlight.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={styles.basicInfo}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Price:</span>
                    <span style={styles.infoValue}>₹{boat.price} {boat.priceType}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Capacity:</span>
                    <span style={styles.infoValue}>{boat.capacity} people</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Speed:</span>
                    <span style={styles.infoValue}>{boat.speed} km/h</span>
                  </div>
                </div>
              </div>
            </div>

            <div id="amenities" style={styles.amenitiesSection}>
              {/* <h2 style={styles.sectionTitle}>Amenities at {boat.boatName}</h2> */}
              
              {/* Popular Amenities Section */}
              <div style={styles.popularAmenities}>
                <div style={styles.popularAmenitiesHeader}>
                  POPULAR AMENITIES
                </div>
                <div style={styles.popularAmenitiesGrid}>
                  {amenitiesData?.slice(0, 4).map(category => 
                    category.items.slice(0, 1).map(item => (
                      <div key={`${category.category}-${item._id}`} style={styles.amenityItem}>
                        <span style={styles.amenityIcon}>{getCategoryIcon(category.category)}</span>
                        <span style={styles.amenityName}>{item.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Categories Grid */}
              <div style={styles.categoriesContainer}>
                {amenitiesData?.map(category => (
                  <div key={category.category} style={styles.categoryBox}>
                    <h3 style={styles.categoryTitle}>{category.category}</h3>
                    <ul style={styles.amenityList}>
                      {category.items.map(item => (
                        <li key={item._id} style={styles.amenityListItem}>
                          <span style={styles.amenityIcon}>{getCategoryIcon(category.category)}</span>
                          {item.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div id="property-policies">
              {/* Add your property policies content here */}
            </div>

            <div id="select-food">
              <div style={styles.foodSelectionWrapper}>
                <button 
                  onClick={handleSelectFood}
                  style={styles.selectFoodButton}
                >
                  🍽️ Select Food Items
                </button>
              </div>
            </div>

            <div id="security">
              {/* Add your security content here */}
            </div>
{/* 
            <ChatComponent 
              boatId={boat._id} 
              boatOwnerId={boat.ownerId} 
              customerId={userDetails.id} 
              currentUser={userDetails} 
            /> */}

            <h3>Select Dates and Number of Adults</h3>
            <DateRangePicker
              ranges={dateRange}
              onChange={(item) => setDateRange([item.selection])}
              minDate={new Date()}
              disabledDates={unavailableDates}
            />
            <div style={styles.passengerSelectionContainer}>
              <div style={styles.passengerSummary}>
                <span style={styles.passengerCount}>
                  {adults} adults • {children} children • 1 room
                </span>
              </div>
              
              <div style={styles.passengerSelector}>
                <div style={styles.passengerType}>
                  <div style={styles.passengerLabel}>
                    <span>Adults</span>
                  </div>
                  <div style={styles.counterControl}>
                    <button 
                      style={{...styles.counterButton, opacity: adults <= 1 ? 0.3 : 1}}
                      onClick={() => handleAdultsChange(adults - 1)}
                      disabled={adults <= 1}
                    >
                      −
                    </button>
                    <span style={styles.counterValue}>{adults}</span>
                    <button 
                      style={{...styles.counterButton, opacity: adults + children >= boat.capacity ? 0.3 : 1}}
                      onClick={() => handleAdultsChange(adults + 1)}
                      disabled={adults + children >= boat.capacity}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div style={styles.passengerType}>
                  <div style={styles.passengerLabel}>
                    <span>Children</span>
                  </div>
                  <div style={styles.counterControl}>
                    <button 
                      style={{...styles.counterButton, opacity: children <= 0 ? 0.3 : 1}}
                      onClick={() => handleChildrenChange(children - 1)}
                      disabled={children <= 0}
                    >
                      −
                    </button>
                    <span style={styles.counterValue}>{children}</span>
                    <button 
                      style={{...styles.counterButton, opacity: adults + children >= boat.capacity ? 0.3 : 1}}
                      onClick={() => handleChildrenChange(children + 1)}
                      disabled={adults + children >= boat.capacity}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {error && <div style={styles.errorMessage}>{error}</div>}
              <div style={styles.capacityInfo}>
                Maximum capacity: {boat.capacity} people
              </div>
            </div>

            {/* Add the map section */}
            {boat.location && boat.location.coordinates && (
              <div style={styles.mapSection}>
                {/* <h3>Location</h3> */}
                <div style={styles.mapContainer}>
                  <MapContainer
                    center={boat.location.coordinates}
                    zoom={13}
                    style={{ height: '400px', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={boat.location.coordinates}>
                      <Popup>
                        {boat.boatName}<br/>
                        {boat.location.place}, {boat.location.district}<br/>
                        {boat.location.pincode}, {boat.location.state}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
                {/* <div style={styles.locationDetails}>
                  <p><strong>Place:</strong> {boat.location.place}</p>
                  <p><strong>District:</strong> {boat.location.district}</p>
                  <p><strong>Pincode:</strong> {boat.location.pincode}</p>
                  <p><strong>State:</strong> {boat.location.state}</p>
                </div> */}
              </div>
            )}

            <button onClick={handleNextStep} style={styles.nextBtn}>
              <img src={forwardbutton} alt="forward" style={styles.backButtonImage} />
            </button>
          </div>
        );

      case 2: // Step 2: Collect user details
        return (
          <div>
            <h3>Enter Your Details</h3>
            <label style={styles.label}>Name:</label>
            <input
              type="text"
              name="name"
              value={userData.name}
              readOnly
              style={styles.input}
            />
            <label style={styles.label}>Phone:</label>
            <input
              type="text"
              name="phone"
              value={userData.phone}
              onChange={handleInputChange}
              style={styles.input}
            />
             {errors.phone && <p style={{ color: 'red' }}>{errors.phone}</p>}
            <label style={styles.label}>Address:</label>
            <input
              type="text"
              name="address"
              value={userData.address}
              onChange={handleInputChange}
              style={styles.input}
            /> {errors.address && <p style={{ color: 'red' }}>{errors.address}</p>}
            <br></br>
            <button onClick={handlePreviousStep} style={styles.backBtn}>
            <img src={backbutton} alt="backbutton" style={styles.backButtonImage} />
            </button>
            <button onClick={handleNextStep} style={styles.nextBtn}>
            <img src={forwardbutton} alt="forward" style={styles.backButtonImage} />
            </button>
          </div>
        );

      case 3: // Step 3: Razorpay Payment
        return (
          <div>
            <h3>Make Payment</h3>
            <div style={styles.paymentSummary}>
              <h4>Booking Summary</h4>
              <div style={styles.summaryItem}>
                <span>Boat Rental:</span>
                <span>₹{boat.priceType === 'perHead' 
                  ? boat.price * adults 
                  : boat.price * Math.ceil((dateRange[0].endDate - dateRange[0].startDate) / (1000 * 60 * 60 * 24))}</span>
              </div>
              
              <div style={styles.summaryItem}>
                <span>Food Items:</span>
                <span>₹{location.state?.totalFoodAmount || 0}</span>
              </div>

              <div style={styles.summaryItem}>
                <span>Total Amount:</span>
                <span style={styles.totalAmount}>₹{location.state?.totalFoodAmount + 
                  (boat.priceType === 'perHead' 
                    ? boat.price * adults 
                    : boat.price * Math.ceil((dateRange[0].endDate - dateRange[0].startDate) / (1000 * 60 * 60 * 24)))}</span>
              </div>
            </div>

            {Object.keys(selectedFoodItems).length > 0 && (
              <>
                <p>Food Items:</p>
                <ul>
                  {Object.entries(selectedFoodItems).map(([foodId, { quantity }]) => {
                    const foodItem = foodItems.find(item => item._id === foodId);
                    return foodItem ? (
                      <li key={foodId}>
                        {foodItem.name} x {quantity} - ₹{foodItem.price * quantity}
                      </li>
                    ) : null;
                  })}
                </ul>
                <p>Total Food Cost: ₹{Object.entries(selectedFoodItems).reduce((total, [foodId, { quantity }]) => {
                  const foodItem = foodItems.find(item => item._id === foodId);
                  return total + (foodItem ? foodItem.price * quantity : 0);
                }, 0)}</p>
              </>
            )}

            <button onClick={handlePreviousStep} style={styles.backBtn}>
              <img src={backbutton} alt="backbutton" style={styles.backButtonImage} />
            </button>
            <button onClick={handleRazorpayPayment} style={styles.payBtn}>
              <img src={payment} alt="payment" style={styles.PaymentImage} />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      {renderStepIndicator()}
      {renderStepContent()}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    marginTop: '1100px',
    // marginBottom: '100px',
    marginLeft: '100px',
    position: 'relative',
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    marginBottom: '-700px',
  },
  over: {
    marginTop: '-50px',
  },
  boatImage: {
    marginTop: '-200px',
    width: '100%',
    height: 'auto',
    marginBottom: '15px',
    borderRadius: '10px',
  },
  label: {
    // marginTop: '-700px',
    display: 'block',
    marginBottom: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    marginBottom: '20px',
    padding: '10px',
    width: '100%',
    maxWidth: '300px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    fontSize: '14px',
  },
  stepsContainer: {
    
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '40px',
    width: '100%',
    position: 'relative',
    marginTop: '20px',
  },
  stepWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    flex: 4,
    margin: '0 10px', // Increased margin to create more distance between steps
    marginRight: '350px',
  },
  stepCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10px',
    fontSize: '18px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s, color 0.3s',
  },
  stepLabel: {
    margin: 0,
    fontSize: '16px',
    color: '#666',
    transition: 'font-weight 0.4s, color 0.4s',
  },
  stepLine: {
    height: '2px',
    width: '91%', // Increased width to cover more distance between steps
    backgroundColor: '#ccc',
    position: 'absolute',
    top: '20px',
    zIndex: -1,
    left: '10%', // Adjusted left position to center the line
  },
  nextBtn: {
    backgroundColor: '#007BFF',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    fontWeight: 'bold',
  },
  backBtn: {
    backgroundColor: '#6c757d',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    marginRight: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    fontWeight: 'bold',
  },
  backButtonImage: {
    width: '20px', // Set width for the image
    height: '20px', // Set height for the image
    marginRight: '8px', // Space between image and text
  },
  PaymentImage: {
    width: '60px', // Set width for the image
    height: '60px', // Set height for the image
    marginRight: '8px', // Space between image and text
  },
  payBtn: {
    backgroundColor: 'black',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    fontWeight: 'bold',
  },
  foodSelectionWrapper: {
    marginBottom: '20px',
  },
  selectFoodButton: {
    backgroundColor: '#ff6b6b',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '20px 0',
    transition: 'all 0.3s ease',
  },
  paymentSummary: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  totalAmount: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
  },
  mapSection: {
    marginTop: '20px',
    marginBottom: '20px',
  },
  mapContainer: {
    border: '1px solid #ddd',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '20px',
  },
  locationDetails: {
    backgroundColor: '#f8f9fe',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '10px',
  },
  amenitiesSection: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    margin: '20px 0',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#333',
  },
  popularAmenities: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px',
  },
  popularAmenitiesHeader: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '4px',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '20px',
  },
  popularAmenitiesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
  },
  amenityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  amenityIcon: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  amenityName: {
    fontSize: '16px',
    color: '#333',
  },
  categoriesContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '30px',
    marginTop: '30px',
  },
  categoryBox: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  categoryTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#333',
  },
  amenityList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  amenityListItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
    color: '#666',
  },
  overviewSection: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    marginBottom: '30px',
  },
  overviewHeader: {
    marginBottom: '20px',
  },
  boatName: {
    fontSize: '28px',
    fontWeight: '600',
    marginBottom: '10px',
    color: '#333',
  },
  ratingLocation: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  location: {
    color: '#666',
    fontSize: '14px',
  },
  imageGallery: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '10px',
    marginBottom: '30px',
    height: '400px',
  },
  mainImageContainer: {
    height: '100%',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  thumbnailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  thumbnailWrapper: {
    position: 'relative',
    height: '195px',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  morePhotosOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
  },
  overviewContent: {
    marginTop: '30px',
  },
  descriptionSection: {
    marginBottom: '30px',
  },
  description: {
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '15px',
  },
  highlightsSection: {
    marginBottom: '30px',
  },
  highlightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  highlightBox: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #eee',
  },
  highlightTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '10px',
    color: '#333',
  },
  highlightDescription: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.4',
  },
  basicInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  infoLabel: {
    fontSize: '14px',
    color: '#666',
  },
  infoValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  formGroup: {
    display: 'flex',
    gap: '20px',
    marginBottom: '15px',
  },
  passengerSelectionContainer: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '16px',
    marginBottom: '20px',
  },
  passengerSummary: {
    padding: '8px 0',
    borderBottom: '1px solid #e0e0e0',
    marginBottom: '16px',
  },
  passengerCount: {
    fontSize: '14px',
    color: '#333',
    fontWeight: '500',
  },
  passengerSelector: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  passengerType: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passengerLabel: {
    fontSize: '16px',
    color: '#333',
  },
  counterControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  counterButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid #e0e0e0',
    backgroundColor: '#fff',
    color: '#333',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
    '&:disabled': {
      cursor: 'not-allowed',
    },
  },
  counterValue: {
    fontSize: '16px',
    fontWeight: '500',
    minWidth: '24px',
    textAlign: 'center',
  },
  capacityInfo: {
    marginTop: '16px',
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
  },
  errorMessage: {
    color: '#dc3545',
    fontSize: '14px',
    marginTop: '8px',
    textAlign: 'center',
  },
};

const navbarStyles = {
  navbar: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: '15px 0',
    position: 'sticky',
    top: '60px', // Account for the main navbar
    zIndex: 100,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  navButton: {
    padding: '10px 20px',
    margin: '0 10px',
    border: 'none',
    background: 'none',
    fontSize: '16px',
    color: '#666',
    cursor: 'pointer',
    position: 'relative',
    transition: 'color 0.3s',
    '&:hover': {
      color: '#333',
    },
    '&.active': {
      color: '#333',
      fontWeight: 'bold',
    },
    '&.active::after': {
      content: '""',
      position: 'absolute',
      bottom: '-5px',
      left: '0',
      width: '100%',
      height: '2px',
      backgroundColor: '#333',
    }
  }
};

const getCategoryIcon = (category) => {
  switch (category.toLowerCase()) {
    case 'safety':
      return '🛡️';
    case 'entertainment':
      return '🎮';
    case 'comfort':
      return '🛋️';
    case 'basic':
      return '📶';
    case 'dining':
      return '🍽️';
    case 'outdoor':
      return '🌳';
    case 'services':
      return '🛎️';
    default:
      return '✨';
  }
};

export default BoatViewDetails;
