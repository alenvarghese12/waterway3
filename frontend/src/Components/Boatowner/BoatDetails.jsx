import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { FaWifi, FaSwimmingPool, FaParking, FaUtensils, FaTv, FaSnowflake, 
         FaFirstAid, FaLifeRing, FaShip, FaTrash, FaEdit, FaPlus, FaSave } from 'react-icons/fa';
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

const BoatDetails = () => {
  const { boatId } = useParams();
  const [boat, setBoat] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    aboutProperty: "",
    propertyHighlights: [{ title: "", description: "" }],
    images: []
  });
  const [previewImages, setPreviewImages] = useState([]);
  const [amenitiesEditing, setAmenitiesEditing] = useState(false);
  const [amenitiesData, setAmenitiesData] = useState({
    categories: [
      { name: 'Safety', icon: <FaLifeRing />, items: [] },
      { name: 'Entertainment', icon: <FaTv />, items: [] },
      { name: 'Comfort', icon: <FaSnowflake />, items: [] },
      { name: 'Basic', icon: <FaWifi />, items: [] }
    ]
  });
  const [newAmenity, setNewAmenity] = useState({
    category: '',
    name: '',
    description: ''
  });
  const [foodItems, setFoodItems] = useState([]);
  const [isFoodEditing, setIsFoodEditing] = useState(false);
  const [foodItem, setFoodItem] = useState({
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
  const [foodImage, setFoodImage] = useState(null);
  const [foodPreviewUrl, setFoodPreviewUrl] = useState(null);
  const [isPolicyEditing, setIsPolicyEditing] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [newPolicy, setNewPolicy] = useState({
    title: '',
    points: [''],
    type: 'general'
  });
  const [location, setLocation] = useState({
    coordinates: [8.5241, 76.9366], // Default coordinates (you can change these)
    address: '',
    landmarks: [],
    attractions: []
  });
  const [isLocationEditing, setIsLocationEditing] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [securityEditing, setSecurityEditing] = useState(false);
  const [securityDetails, setSecurityDetails] = useState({
    title: '',
    description: '',
    safetyDocument: null,
    insuranceDocument: null,
    certificateNumber: '',
    insuranceNumber: '',
    validUntil: '',
    insuranceValidUntil: ''
  });
  const [cancellationEditing, setCancellationEditing] = useState(false);
  const [cancellationPolicy, setCancellationPolicy] = useState({
    type: 'no_free_cancellation', // or 'free_cancellation'
    freeWindow: '', // '24h', '14h', '6h', 'anytime'
    description: '',
    terms: ''
  });
  const [editingAmenity, setEditingAmenity] = useState(null);
  const [editingPolicy, setEditingPolicy] = useState(null);

  useEffect(() => {
    fetchBoatDetails();
  }, [boatId]);

  // Add this useEffect to fetch policies when component mounts
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `https://waterway3.onrender.com/api/boats/boatsdg/${boatId}/policies`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        setPolicies(response.data);
      } catch (error) {
        console.error('Error fetching policies:', error);
        setError('Failed to fetch policies. Please try again.');
      }
    };

    if (boatId) {
      fetchPolicies();
    }
  }, [boatId]);

  // Add this useEffect to fetch amenities when component mounts
  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `https://waterway3.onrender.com/api/boats/boatsdg/${boatId}/amenities`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data && response.data.amenities) {
          // Update the amenitiesData state with fetched data
          setAmenitiesData(prev => ({
            ...prev,
            categories: prev.categories.map(category => ({
              ...category,
              items: response.data.amenities.find(a => a.category === category.name)?.items || []
            }))
          }));
        }
      } catch (error) {
        console.error('Error fetching amenities:', error);
        setError('Failed to fetch amenities');
      }
    };

    if (boatId) {
      fetchAmenities();
    }
  }, [boatId]);

  // Add this useEffect to fetch security details when component mounts
  useEffect(() => {
    const fetchSecurityDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `https://waterway3.onrender.com/api/boats/boatsdg/${boatId}/security`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data) {
          // Update both the boat's security data and the form state
          setBoat(prev => ({
            ...prev,
            security: response.data
          }));
          setSecurityDetails({
            title: response.data.title || '',
            description: response.data.description || '',
            certificateNumber: response.data.certificateNumber || '',
            validUntil: response.data.validUntil ? new Date(response.data.validUntil).toISOString().split('T')[0] : '',
            insuranceNumber: response.data.insuranceNumber || '',
            insuranceValidUntil: response.data.insuranceValidUntil ? new Date(response.data.insuranceValidUntil).toISOString().split('T')[0] : '',
            safetyDocument: response.data.safetyDocument || null,
            insuranceDocument: response.data.insuranceDocument || null
          });
        }
      } catch (error) {
        console.error('Error fetching security details:', error);
        setError('Failed to fetch security details');
      }
    };

    if (boatId) {
      fetchSecurityDetails();
    }
  }, [boatId]);

    const fetchBoatDetails = async () => {
      try {
      const token = localStorage.getItem('token');
      // First, fetch the boat details
      const boatResponse = await axios.get(`https://waterway3.onrender.com/api/boats/boatsdg/${boatId}`);
      
      // Fetch overview details
      const overviewResponse = await axios.get(
        `https://waterway3.onrender.com/api/boats/boatsdg/${boatId}/overview`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (boatResponse.data) {
        const updatedBoat = {
          ...boatResponse.data,
          overview: overviewResponse.data !== 'No overview found' ? overviewResponse.data : null
        };
        setBoat(updatedBoat);

        // Initialize form data with boat description and existing overview data
        setFormData({
          description: boatResponse.data.description || '', // Use description from boatreg
          aboutProperty: overviewResponse.data?.aboutProperty || '',
          propertyHighlights: overviewResponse.data?.propertyHighlights || [{ title: '', description: '' }]
        });
        
        // Set preview images for existing images
        if (overviewResponse.data?.images) {
          const previews = overviewResponse.data.images.map(image => ({
            url: `https://waterway3.onrender.com/uploads/${image}`,
            file: null
          }));
          setPreviewImages(previews);
        }
      }
      } catch (error) {
        console.error("Error fetching boat details:", error);
      setError("Failed to load boat details. Please try again later.");
      setBoat(null);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPreviewImages = files.map(file => ({
      url: URL.createObjectURL(file),
      file: file
    }));
    setPreviewImages([...previewImages, ...newPreviewImages]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHighlightChange = (index, field, value) => {
    const newHighlights = [...formData.propertyHighlights];
    newHighlights[index] = {
      ...newHighlights[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      propertyHighlights: newHighlights
    }));
  };

  const addHighlight = () => {
    setFormData(prev => ({
      ...prev,
      propertyHighlights: [...prev.propertyHighlights, { title: "", description: "" }]
    }));
  };

  const removeHighlight = (index) => {
    setFormData(prev => ({
      ...prev,
      propertyHighlights: prev.propertyHighlights.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('description', formData.description);
      formDataToSend.append('aboutProperty', formData.aboutProperty);
      formDataToSend.append('propertyHighlights', JSON.stringify(formData.propertyHighlights));
      
      // Append only new images
      previewImages.forEach((image) => {
        if (image.file) {
          formDataToSend.append('images', image.file);
        }
      });

      const token = localStorage.getItem('token');
      const response = await axios.put(
        `https://waterway3.onrender.com/api/boats/boatsdg/${boatId}/overview`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data) {
        setBoat(prev => ({
          ...prev,
          overview: response.data
        }));
        setIsEditing(false);
        setError(null);
      }
    } catch (error) {
      console.error("Error updating boat details:", error);
      setError("Failed to update boat details. Please try again later.");
    }
  };

  const handleDeleteImage = async (imageIndex) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `https://waterway3.onrender.com/api/boats/boatsdg/${boatId}/overview/images/${imageIndex}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setPreviewImages(prev => prev.filter((_, index) => index !== imageIndex));
    } catch (error) {
      console.error("Error deleting image:", error);
      setError("Failed to delete image. Please try again.");
    }
  };

  const handleDeleteHighlight = async (highlightIndex) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `https://waterway3.onrender.com/api/boats/boatsdg/${boatId}/overview/highlights/${highlightIndex}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setFormData(prev => ({
        ...prev,
        propertyHighlights: prev.propertyHighlights.filter((_, index) => index !== highlightIndex)
      }));
    } catch (error) {
      console.error("Error deleting highlight:", error);
      setError("Failed to delete highlight. Please try again.");
    }
  };

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAmenitySubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `https://waterway3.onrender.com/api/boats/boatsdg/${boatId}/amenities`,
        {
          category: newAmenity.category,
          item: {
            name: newAmenity.name,
            description: newAmenity.description
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data) {
        setBoat(response.data);
        setNewAmenity({ category: '', name: '', description: '' });
      }
    } catch (error) {
      console.error("Error updating amenities:", error);
      if (error.response?.status === 401) {
        setError("Please login again to continue.");
      } else {
        setError("Failed to update amenities. Please try again later.");
      }
    }
  };

  const handleDeleteAmenity = async (category, itemId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `https://waterway3.onrender.com/api/boats/boatsdg/${boatId}/amenities/${category}/${itemId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data) {
        setBoat(response.data);
        setAmenitiesData({
          categories: amenitiesData.categories.map(cat => ({
            ...cat,
            items: cat.name === category ? 
              cat.items.filter(item => item._id !== itemId) : 
              cat.items
          }))
        });
      }
    } catch (error) {
      console.error("Error deleting amenity:", error);
      setError("Failed to delete amenity. Please try again later.");
    }
  };

  const fetchFoodItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `https://waterway3.onrender.com/api/food/boat/${boatId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data) {
        console.log('Fetched food items:', response.data);
        setFoodItems(response.data);
      }
    } catch (error) {
      console.error('Error fetching food items:', error);
      setError('Failed to fetch food items. Please try again.');
    }
  };

  useEffect(() => {
    if (boatId) {
      fetchFoodItems();
    }
  }, [boatId]);

  const handleFoodImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFoodImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFoodPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFoodInputChange = (e) => {
    const { name, value } = e.target;
    setFoodItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFoodSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!foodItem.name || !foodItem.description || !foodItem.price || !foodItem.category) {
        setError('Please fill in all required fields');
        return;
      }

      const token = localStorage.getItem('token');
      
      // First get the user data to get boatOwnerId
      const userResponse = await axios.get('https://waterway3.onrender.com/api/auth/user-data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const boatOwnerId = userResponse.data._id || userResponse.data.id;
      
      const formData = new FormData();
      formData.append('name', foodItem.name.trim());
      formData.append('description', foodItem.description.trim());
      formData.append('price', Number(foodItem.price));
      formData.append('category', foodItem.category);
      formData.append('boatId', boatId);
      formData.append('boatOwnerId', boatOwnerId);
      
      // Initialize customizations if not present
      const customizations = foodItem.customizations || {
        salt: false,
        pepper: false,
        chili: false,
      };
      formData.append('customizations', JSON.stringify(customizations));
      
      if (foodImage) {
        formData.append('image', foodImage);
      }

      // Log form data for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await axios.post(
        'https://waterway3.onrender.com/api/food/food-items',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        setFoodItems([...foodItems, response.data]);
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
        setFoodImage(null);
        setFoodPreviewUrl(null);
        setIsFoodEditing(false);
      }
    } catch (error) {
      console.error('Error adding food item:', error);
      setError(error.response?.data?.message || 'Failed to add food item. Please try again.');
    }
  };

  const handleDeleteFoodItem = async (foodItemId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `https://waterway3.onrender.com/api/food/food-items/${foodItemId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update the UI only after successful deletion
      setFoodItems(prevItems => prevItems.filter(item => item._id !== foodItemId));
    } catch (error) {
      console.error('Error deleting food item:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete food item. Please try again.';
      setError(errorMessage);
    }
  };

  const handlePointChange = (index, value) => {
    setNewPolicy(prev => ({
      ...prev,
      points: prev.points.map((point, i) => i === index ? value : point)
    }));
  };

  const addPoint = () => {
    setNewPolicy(prev => ({
      ...prev,
      points: [...prev.points, '']
    }));
  };

  const removePoint = (index) => {
    setNewPolicy(prev => ({
      ...prev,
      points: prev.points.filter((_, i) => i !== index)
    }));
  };

  const handleEditPolicy = async (policyId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Find the policy to edit
      const policyToEdit = policies.find(p => p._id === policyId);
      if (!policyToEdit) return;

      // Set the form data for editing
      setNewPolicy({
        title: policyToEdit.title,
        points: policyToEdit.points,
        type: policyToEdit.type
      });
      setEditingPolicy(policyId);
      setIsPolicyEditing(true);
    } catch (error) {
      console.error('Error preparing policy edit:', error);
      setError('Failed to prepare policy edit');
    }
  };

  const handlePolicySubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Filter out empty points
      const filteredPoints = newPolicy.points.filter(point => point.trim() !== '');
      
      if (filteredPoints.length === 0) {
        setError('At least one policy point is required');
        return;
      }

      const policyData = {
        title: newPolicy.title,
        points: filteredPoints,
        type: newPolicy.type
      };

      let response;
      if (editingPolicy) {
        // Update existing policy
        response = await axios.put(
          `https://waterway3.onrender.com/api/boats/boatsdg/${boatId}/policies/${editingPolicy}`,
          policyData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        setPolicies(policies.map(policy => 
          policy._id === editingPolicy ? response.data : policy
        ));
      } else {
        // Add new policy
        response = await axios.post(
          `https://waterway3.onrender.com/api/boats/boatsdg/${boatId}/policies`,
          policyData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        setPolicies([...policies, response.data]);
      }

      // Reset form
      setNewPolicy({
        title: '',
        points: [''],
        type: 'general'
      });
      setEditingPolicy(null);
      setIsPolicyEditing(false);
    } catch (error) {
      console.error('Error saving policy:', error);
      setError('Failed to save policy. Please try again.');
    }
  };

  const handleDeletePolicy = async (policyId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Add confirmation dialog
      if (!window.confirm('Are you sure you want to delete this policy?')) {
        return;
      }

      await axios.delete(
        `https://waterway3.onrender.com/api/boats/boatsdg/${boatId}/policies/${policyId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setPolicies(policies.filter(policy => policy._id !== policyId));
    } catch (error) {
      console.error('Error deleting policy:', error);
      setError('Failed to delete policy. Please try again.');
    }
  };

  const handleLocationSearch = async () => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}`
      );
      
      if (response.data && response.data.length > 0) {
        const { lat, lon, display_name } = response.data[0];
        setLocation(prev => ({
          ...prev,
          coordinates: [parseFloat(lat), parseFloat(lon)],
          address: display_name
        }));
      }
    } catch (error) {
      console.error('Error searching location:', error);
      setError('Failed to search location. Please try again.');
    }
  };

  const handleSaveLocation = async () => {
    try {
      const locationData = {
        place: boat.location.place,
        district: boat.location.district,
        pincode: boat.location.pincode,
        state: boat.location.state,
        country: 'India',
        coordinates: location.coordinates
      };

      const response = await axios.put(
        `https://waterway3.onrender.com/api/boats/boatsdg/${boatId}/location`,
        locationData
      );
      
      if (response.data) {
        setBoat(prev => ({
          ...prev,
          location: response.data.location
        }));
        setLocation(prev => ({
          ...prev,
          coordinates: response.data.location.coordinates || prev.coordinates
        }));
        setIsLocationEditing(false);
      }
    } catch (error) {
      console.error('Error updating location:', error);
      setError('Failed to update location. Please try again.');
    }
  };

  // Map click handler component
  const MapClickHandler = () => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        try {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          
          if (response.data) {
            setLocation(prev => ({
              ...prev,
              coordinates: [lat, lng],
              address: response.data.display_name
            }));
          }
        } catch (error) {
          console.error('Error getting address:', error);
        }
      },
    });
    return null;
  };

  const handleSafetyDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file && !file.name.endsWith('.pdf')) {
      setError('Safety certificate must be a PDF file');
      return;
    }
    setSecurityDetails(prev => ({
      ...prev,
      safetyDocument: file
    }));
  };

  const handleInsuranceDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file && !file.name.endsWith('.pdf')) {
      setError('Insurance document must be a PDF file');
      return;
    }
    setSecurityDetails(prev => ({
      ...prev,
      insuranceDocument: file
    }));
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('title', securityDetails.title);
      formData.append('description', securityDetails.description);
      formData.append('certificateNumber', securityDetails.certificateNumber);
      formData.append('validUntil', securityDetails.validUntil);
      formData.append('insuranceNumber', securityDetails.insuranceNumber);
      formData.append('insuranceValidUntil', securityDetails.insuranceValidUntil);
      
      if (securityDetails.safetyDocument) {
        formData.append('safetyDocument', securityDetails.safetyDocument);
      }
      if (securityDetails.insuranceDocument) {
        formData.append('insuranceDocument', securityDetails.insuranceDocument);
      }

      const response = await axios.put(
        `https://waterway3.onrender.com/api/boats/boatsdg/${boatId}/security`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data) {
        setBoat(prev => ({
          ...prev,
          security: response.data
        }));
        setSecurityEditing(false);
        setError(null);
      }
    } catch (error) {
      console.error('Error updating security details:', error);
      setError('Failed to update security details. Please try again.');
    }
  };

  const handleCancellationSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `https://waterway3.onrender.com/api/boats/boatsdg/${boatId}/cancellation-policy`,
        cancellationPolicy
      );

      if (response.data) {
        setBoat(prev => ({
          ...prev,
          cancellationPolicy: response.data.cancellationPolicy
        }));
        setCancellationEditing(false);
        setError(null);
      }
    } catch (error) {
      console.error('Error updating cancellation policy:', error);
      setError('Failed to update cancellation policy. Please try again.');
    }
  };

  const handleEditAmenity = async (category, item) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `https://waterway3.onrender.com/api/boats/boatsdg/${boatId}/amenities/${item._id}`,
        {
          category,
          item: {
            name: newAmenity.name,
            description: newAmenity.description
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data) {
        const updatedAmenities = response.data.amenities || [];
        setAmenitiesData({
          categories: amenitiesData.categories.map(cat => ({
            ...cat,
            items: cat.name === category ? 
              updatedAmenities.find(a => a.category === category)?.items || [] : 
              cat.items
          }))
        });
        setEditingAmenity(null);
        setNewAmenity({ category: '', name: '', description: '' });
      }
    } catch (error) {
      console.error("Error updating amenity:", error);
      setError("Failed to update amenity. Please try again later.");
    }
  };

  if (error) {
    return <div style={{ textAlign: "center", padding: "20px", color: "red" }}>{error}</div>;
  }

  if (!boat) {
    return <div style={{ textAlign: "center", padding: "20px" }}>Loading boat details...</div>;
  }

  return (
    <div>
      <nav style={styles.navbar}>
        {['Overview', 'Amenities', 'AddFoodItem', 'PropertyPolicies', 'Location', 'Security', 'Cancellation'].map((section) => (
          <button key={section} onClick={() => scrollToSection(section)} style={styles.navButton}>
            {section.replace(/([A-Z])/g, ' $1').trim()}
          </button>
        ))}
      </nav>
      
      <div style={styles.container}>
        <section id="Overview" style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2>Overview</h2>
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              style={styles.editButton}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} style={styles.form}>
              {/* Image Upload */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Property Images</label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={styles.fileInput}
                />
                <div style={styles.imagePreviewContainer}>
                  {previewImages.map((image, index) => (
                    <div key={index} style={styles.imagePreview}>
                      <img src={image.url} alt={`Preview ${index}`} style={styles.previewImage} />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(index)}
                        style={styles.removeImageButton}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={styles.textarea}
                  placeholder="Enter property description..."
                  readOnly // Make it read-only since it comes from boatreg
                />
              </div>

              {/* About Property */}
              <div style={styles.formGroup}>
                <label style={styles.label}>About Property</label>
                <textarea
                  name="aboutProperty"
                  value={formData.aboutProperty}
                  onChange={handleInputChange}
                  style={styles.textarea}
                  placeholder="Enter details about the property..."
                />
              </div>

              {/* Property Highlights */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Property Highlights</label>
                {formData.propertyHighlights.map((highlight, index) => (
                  <div key={index} style={styles.highlightContainer}>
                    <input
                      type="text"
                      value={highlight.title}
                      onChange={(e) => handleHighlightChange(index, 'title', e.target.value)}
                      placeholder="Highlight title"
                      style={styles.input}
                    />
                    <textarea
                      value={highlight.description}
                      onChange={(e) => handleHighlightChange(index, 'description', e.target.value)}
                      placeholder="Highlight description"
                      style={styles.textarea}
                    />
                    <button
                      type="button"
                      onClick={() => removeHighlight(index)}
                      style={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addHighlight}
                  style={styles.addButton}
                >
                  Add Highlight
                </button>
              </div>

              <button type="submit" style={styles.submitButton}>
                Save Changes
              </button>
            </form>
          ) : (
            <div style={styles.viewMode}>
              {/* Display Images */}
              <div style={styles.imageGallery}>
                {boat?.overview?.images?.map((image, index) => (
                  <img
                    key={index}
                    src={`https://waterway3.onrender.com/uploads/${image}`}
                    alt={`Boat ${index + 1}`}
                    style={styles.galleryImage}
                  />
                ))}
              </div>

              {/* Display Description */}
              <div style={styles.contentSection}>
                <h3>Description</h3>
                <p>{boat?.description || 'No description available'}</p>
              </div>

              {/* Display About Property */}
              <div style={styles.contentSection}>
                <h3>About Property</h3>
                <p>{boat?.overview?.aboutProperty || 'No information available'}</p>
              </div>

              {/* Display Property Highlights */}
              <div style={styles.contentSection}>
                <h3>Property Highlights</h3>
                <div style={styles.highlightsGrid}>
                  {boat?.overview?.propertyHighlights?.map((highlight, index) => (
                    <div key={index} style={styles.highlightCard}>
                      <h4>{highlight.title}</h4>
                      <p>{highlight.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
        <section id="Amenities" style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2>Amenities</h2>
            <button 
              onClick={() => setAmenitiesEditing(!amenitiesEditing)} 
              style={styles.editButton}
            >
              {amenitiesEditing ? 'Done' : 'Add Amenities'}
            </button>
          </div>

          {amenitiesEditing ? (
            <div style={styles.amenitiesForm}>
              <form onSubmit={handleAmenitySubmit}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Category</label>
                  <select
                    value={newAmenity.category}
                    onChange={(e) => setNewAmenity({...newAmenity, category: e.target.value})}
                    style={styles.select}
                    required
                  >
                    <option value="">Select Category</option>
                    {amenitiesData.categories.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Amenity Name</label>
                  <input
                    type="text"
                    value={newAmenity.name}
                    onChange={(e) => setNewAmenity({...newAmenity, name: e.target.value})}
                    style={styles.input}
                    placeholder="Enter amenity name"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Description</label>
                  <input
                    type="text"
                    value={newAmenity.description}
                    onChange={(e) => setNewAmenity({...newAmenity, description: e.target.value})}
                    style={styles.input}
                    placeholder="Enter description"
                    required
                  />
                </div>

                <button type="submit" style={styles.addButton}>
                  <FaPlus /> Add Amenity
                </button>
              </form>
            </div>
          ) : (
            <div style={styles.amenitiesGrid}>
              {amenitiesData.categories.map(category => (
                <div key={category.name} style={styles.categoryCard}>
                  <div style={styles.categoryHeader}>
                    <span style={styles.categoryIcon}>{category.icon}</span>
                    <h3 style={styles.categoryTitle}>{category.name}</h3>
                  </div>
                  <div style={styles.amenitiesList}>
                    {category.items.map((item, index) => (
                      <div key={item._id || index} style={styles.amenityItem}>
                        {editingAmenity === item._id ? (
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            handleEditAmenity(category.name, item);
                          }} style={styles.editForm}>
                            <input
                              type="text"
                              value={newAmenity.name}
                              onChange={(e) => setNewAmenity({...newAmenity, name: e.target.value})}
                              placeholder="Amenity name"
                              style={styles.editInput}
                            />
                            <input
                              type="text"
                              value={newAmenity.description}
                              onChange={(e) => setNewAmenity({...newAmenity, description: e.target.value})}
                              placeholder="Description"
                              style={styles.editInput}
                            />
                            <div style={styles.editActions}>
                              <button type="submit" style={styles.saveButton}>
                                <FaSave /> Save
                              </button>
                              <button 
                                type="button" 
                                onClick={() => setEditingAmenity(null)}
                                style={styles.cancelButton}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div style={styles.amenityContent}>
                              <h4 style={styles.amenityName}>{item.name}</h4>
                              <p style={styles.amenityDescription}>{item.description}</p>
                            </div>
                            <div style={styles.amenityActions}>
                              <button
                                onClick={() => {
                                  setEditingAmenity(item._id);
                                  setNewAmenity({
                                    category: category.name,
                                    name: item.name,
                                    description: item.description
                                  });
                                }}
                                style={{...styles.editButton, backgroundColor: '#2196F3', color: 'white'}}
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteAmenity(category.name, item._id)}
                                style={{...styles.deleteButton, backgroundColor: '#f44336', color: 'white'}}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section id="AddFoodItem" style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2>Food Items</h2>
            <button 
              onClick={() => setIsFoodEditing(!isFoodEditing)} 
              style={styles.editButton}
            >
              {isFoodEditing ? 'Cancel' : 'Add Food Item'}
            </button>
          </div>

          {isFoodEditing ? (
            <form onSubmit={handleFoodSubmit} style={styles.foodForm}>
              <div style={styles.imageUpload}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFoodImageChange}
                  style={styles.fileInput}
                  id="food-image-upload"
                />
                <label htmlFor="food-image-upload" style={styles.uploadLabel}>
                  {foodPreviewUrl ? (
                    <img src={foodPreviewUrl} alt="Preview" style={styles.preview} />
                  ) : (
                    <div style={styles.uploadPlaceholder}>
                      <span>Click to upload food image</span>
                    </div>
                  )}
                </label>
              </div>

              <div style={styles.formGroup}>
                <input
                  type="text"
                  name="name"
                  placeholder="Food Name"
                  value={foodItem.name}
                  onChange={handleFoodInputChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <textarea
                  name="description"
                  placeholder="Description"
                  value={foodItem.description}
                  onChange={handleFoodInputChange}
                  style={styles.textarea}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <input
                  type="number"
                  name="price"
                  placeholder="Price"
                  value={foodItem.price}
                  onChange={handleFoodInputChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <select 
                  name="category" 
                  value={foodItem.category} 
                  onChange={handleFoodInputChange}
                  style={styles.select}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="fresh_juice">Fresh Juice</option>
                  <option value="soft_drinks">Soft Drinks</option>
                </select>
              </div>

              <button type="submit" style={styles.submitButton}>
                Add Food Item
              </button>
            </form>
          ) : (
            <div style={styles.foodItemsGrid}>
              {foodItems.map((item) => (
                <div key={item._id} style={styles.foodCard}>
                  <div style={styles.foodImageContainer}>
                    {item.image && (
                      <img
                        src={`https://waterway3.onrender.com/uploads/${item.image}`}
                        alt={item.name}
                        style={styles.foodImage}
                      />
                    )}
                    <div style={styles.foodCategory}>{item.category}</div>
                  </div>
                  <div style={styles.foodInfo}>
                    <h3 style={styles.foodName}>{item.name}</h3>
                    <p style={styles.foodDescription}>{item.description}</p>
                    <div style={styles.foodFooter}>
                      <span style={styles.foodPrice}>₹{item.price}</span>
                      <button
                        onClick={() => handleDeleteFoodItem(item._id)}
                        style={styles.deleteButton}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section id="PropertyPolicies" style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2>Property Policies</h2>
            <button 
              onClick={() => setIsPolicyEditing(!isPolicyEditing)} 
              style={styles.editButton}
            >
              {isPolicyEditing ? 'Done' : 'Add Policy'}
            </button>
          </div>

          {isPolicyEditing ? (
            <form onSubmit={handlePolicySubmit} style={styles.policyForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Policy Type</label>
                <select
                  value={newPolicy.type}
                  onChange={(e) => setNewPolicy({...newPolicy, type: e.target.value})}
                  style={styles.select}
                  required
                >
                  <option value="general">General</option>
                  <option value="cancellation">Cancellation</option>
                  <option value="safety">Safety</option>
                  <option value="house_rules">House Rules</option>
                  <option value="payment">Payment</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Title</label>
                <input
                  type="text"
                  value={newPolicy.title}
                  onChange={(e) => setNewPolicy({...newPolicy, title: e.target.value})}
                  style={styles.input}
                  placeholder="Enter policy title"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Policy Points</label>
                {newPolicy.points.map((point, index) => (
                  <div key={index} style={styles.pointContainer}>
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => handlePointChange(index, e.target.value)}
                      style={styles.input}
                      placeholder={`Enter policy point ${index + 1}`}
                      required
                    />
                    {newPolicy.points.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePoint(index)}
                        style={styles.removeButton}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPoint}
                  style={styles.addButton}
                >
                  Add Point
                </button>
              </div>

              <div style={styles.formActions}>
                <button type="submit" style={styles.submitButton}>
                  {editingPolicy ? 'Update Policy' : 'Add Policy'}
                </button>
                {editingPolicy && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPolicy(null);
                      setNewPolicy({
                        title: '',
                        points: [''],
                        type: 'general'
                      });
                    }}
                    style={styles.cancelButton}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div style={styles.policiesContainer}>
              {['general', 'cancellation', 'safety', 'house_rules', 'payment'].map(type => {
                const typePolicies = policies.filter(policy => policy.type === type);
                if (typePolicies.length === 0) return null;

                return (
                  <div key={type} style={styles.policySection}>
                    <h3 style={styles.policyTypeTitle}>
                      {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Policies
                    </h3>
                    <div style={styles.policyCards}>
                      {typePolicies.map(policy => (
                        <div key={policy._id} style={styles.policyCard}>
                          <div style={styles.policyContent}>
                            <h4 style={styles.policyTitle}>{policy.title}</h4>
                            <ul style={styles.policyPoints}>
                              {policy.points.map((point, index) => (
                                <li key={index} style={styles.policyPoint}>{point}</li>
                              ))}
                            </ul>
                          </div>
                          <div style={styles.policyActions}>
                            <button
                              onClick={() => handleDeletePolicy(policy._id)}
                              style={styles.deleteButton}
                            >
                              <FaTrash />
                            </button>
                            <button
                              onClick={() => handleEditPolicy(policy._id)}
                              style={styles.editButton}
                            >
                              <FaEdit />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        <section id="Location" style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2>Location</h2>
            <button 
              onClick={() => {
                setIsLocationEditing(!isLocationEditing);
                if (!isLocationEditing) return;
                handleSaveLocation();
              }}
              style={styles.editButton}
            >
              {isLocationEditing ? 'Save Changes' : 'Edit Location'}
            </button>
          </div>

          {isLocationEditing ? (
            <div style={styles.locationForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Place</label>
                <input
                  type="text"
                  value={boat.location?.place || ''}
                  onChange={(e) => setBoat(prev => ({
                    ...prev,
                    location: { ...prev.location, place: e.target.value }
                  }))}
                  style={styles.input}
                  placeholder="Enter place"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>District</label>
                <input
                  type="text"
                  value={boat.location?.district || ''}
                  onChange={(e) => setBoat(prev => ({
                    ...prev,
                    location: { ...prev.location, district: e.target.value }
                  }))}
                  style={styles.input}
                  placeholder="Enter district"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Pincode</label>
                <input
                  type="text"
                  value={boat.location?.pincode || ''}
                  onChange={(e) => setBoat(prev => ({
                    ...prev,
                    location: { ...prev.location, pincode: e.target.value }
                  }))}
                  style={styles.input}
                  placeholder="Enter pincode"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>State</label>
                <input
                  type="text"
                  value={boat.location?.state || ''}
                  onChange={(e) => setBoat(prev => ({
                    ...prev,
                    location: { ...prev.location, state: e.target.value }
                  }))}
                  style={styles.input}
                  placeholder="Enter state"
                />
              </div>

              <div style={styles.mapContainer}>
                <MapContainer
                  center={location.coordinates}
                  zoom={13}
                  style={{ height: '400px', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={location.coordinates}>
                    <Popup>
                      {boat.location ? 
                        `${boat.location.place}, ${boat.location.district}, ${boat.location.pincode}, ${boat.location.state}, India`
                        : 'Selected location'
                      }
                    </Popup>
                  </Marker>
                  {isLocationEditing && <MapClickHandler />}
                </MapContainer>
              </div>
            </div>
          ) : (
            <div style={styles.locationView}>
              <div style={styles.addressDisplay}>
                <h3>Location Details</h3>
                {boat.location && (
                  <>
                    <p><strong>Place:</strong> {boat.location.place}</p>
                    <p><strong>District:</strong> {boat.location.district}</p>
                    <p><strong>Pincode:</strong> {boat.location.pincode}</p>
                    <p><strong>State:</strong> {boat.location.state}</p>
                  </>
                )}
              </div>

              <div style={styles.mapContainer}>
                <MapContainer
                  center={location.coordinates}
                  zoom={13}
                  style={{ height: '400px', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={location.coordinates}>
                    <Popup>
                      {boat.location ? 
                        `${boat.location.place}, ${boat.location.district}, ${boat.location.pincode}, ${boat.location.state}, India`
                        : 'Selected location'
                      }
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          )}
        </section>
        <section id="Security" style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2>Passenger Security</h2>
            <button 
              onClick={() => setSecurityEditing(!securityEditing)} 
              style={styles.editButton}
            >
              {securityEditing ? 'Save Changes' : 'Edit Security'}
            </button>
          </div>

          {securityEditing ? (
            <form onSubmit={handleSecuritySubmit} style={styles.securityForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Security Title</label>
                <input
                  type="text"
                  value={securityDetails.title}
                  onChange={(e) => setSecurityDetails(prev => ({
                    ...prev,
                    title: e.target.value
                  }))}
                  style={styles.input}
                  placeholder="Enter security title"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={securityDetails.description}
                  onChange={(e) => setSecurityDetails(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  style={styles.textarea}
                  placeholder="Enter security description"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Safety Certificate Number</label>
                <input
                  type="text"
                  value={securityDetails.certificateNumber}
                  onChange={(e) => setSecurityDetails(prev => ({
                    ...prev,
                    certificateNumber: e.target.value
                  }))}
                  style={styles.input}
                  placeholder="Enter safety certificate number"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Valid Until</label>
                <input
                  type="date"
                  value={securityDetails.validUntil}
                  onChange={(e) => setSecurityDetails(prev => ({
                    ...prev,
                    validUntil: e.target.value
                  }))}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Safety Certificate (PDF)</label>
                <input
                  type="file"
                  onChange={handleSafetyDocumentChange}
                  accept=".pdf"
                  style={styles.fileInput}
                  required={!boat.safetyDocument}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Insurance Number</label>
                <input
                  type="text"
                  value={securityDetails.insuranceNumber}
                  onChange={(e) => setSecurityDetails(prev => ({
                    ...prev,
                    insuranceNumber: e.target.value
                  }))}
                  style={styles.input}
                  placeholder="Enter insurance number"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Insurance Valid Until</label>
                <input
                  type="date"
                  value={securityDetails.insuranceValidUntil}
                  onChange={(e) => setSecurityDetails(prev => ({
                    ...prev,
                    insuranceValidUntil: e.target.value
                  }))}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Insurance Document (PDF)</label>
                <input
                  type="file"
                  onChange={handleInsuranceDocumentChange}
                  accept=".pdf"
                  style={styles.fileInput}
                  required={!boat.insuranceDocument}
                />
              </div>

              <button type="submit" style={styles.submitButton}>
                Save Security Details
              </button>
            </form>
          ) : (
            <div style={styles.securityView}>
              {boat.security ? (
                <>
                  <div style={styles.securityCard}>
                    <h3 style={styles.securityTitle}>{boat.security.title}</h3>
                    <p style={styles.securityDescription}>{boat.security.description}</p>
                    
                    <div style={styles.documentSection}>
                      <h4>Safety Certificate</h4>
                      <p><strong>Certificate Number:</strong> {boat.security.certificateNumber}</p>
                      <p><strong>Valid Until:</strong> {new Date(boat.security.validUntil).toLocaleDateString()}</p>
                      {boat.security.safetyDocument && (
                        <a 
                          href={`https://waterway3.onrender.com/uploads/${boat.security.safetyDocument}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.documentLink}
                        >
                          View Safety Certificate
                        </a>
                      )}
                    </div>

                    <div style={styles.documentSection}>
                      <h4>Insurance Details</h4>
                      <p><strong>Insurance Number:</strong> {boat.security.insuranceNumber}</p>
                      <p><strong>Valid Until:</strong> {new Date(boat.security.insuranceValidUntil).toLocaleDateString()}</p>
                      {boat.security.insuranceDocument && (
                        <a 
                          href={`https://waterway3.onrender.com/uploads/${boat.security.insuranceDocument}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.documentLink}
                        >
                          View Insurance Document
                        </a>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p style={styles.noDataMessage}>No security details added yet.</p>
              )}
            </div>
          )}
        </section>
        <section id="Cancellation" style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2>Cancellation Policy</h2>
            <button 
              onClick={() => setCancellationEditing(!cancellationEditing)} 
              style={styles.editButton}
            >
              {cancellationEditing ? 'Save Changes' : 'Edit Policy'}
            </button>
          </div>

          {cancellationEditing ? (
            <form onSubmit={handleCancellationSubmit} style={styles.cancellationForm}>
              <div style={styles.radioGroup}>
                <div style={styles.radioOption}>
                  <input
                    type="radio"
                    id="no_free_cancellation"
                    name="cancellation_type"
                    value="no_free_cancellation"
                    checked={cancellationPolicy.type === 'no_free_cancellation'}
                    onChange={(e) => setCancellationPolicy(prev => ({
                      ...prev,
                      type: e.target.value,
                      freeWindow: '' // Reset free window when switching to no free cancellation
                    }))}
                  />
                  <label htmlFor="no_free_cancellation" style={styles.radioLabel}>
                    No Free Cancellation
                  </label>
                </div>

                <div style={styles.radioOption}>
                  <input
                    type="radio"
                    id="free_cancellation"
                    name="cancellation_type"
                    value="free_cancellation"
                    checked={cancellationPolicy.type === 'free_cancellation'}
                    onChange={(e) => setCancellationPolicy(prev => ({
                      ...prev,
                      type: e.target.value
                    }))}
                  />
                  <label htmlFor="free_cancellation" style={styles.radioLabel}>
                    Free Cancellation
                  </label>
                </div>
              </div>

              {cancellationPolicy.type === 'free_cancellation' && (
                <div style={styles.freeWindowSelect}>
                  <label style={styles.label}>Free Cancellation Window</label>
                  <select
                    value={cancellationPolicy.freeWindow}
                    onChange={(e) => setCancellationPolicy(prev => ({
                      ...prev,
                      freeWindow: e.target.value
                    }))}
                    style={styles.select}
                    required
                  >
                    <option value="">Select cancellation window</option>
                    <option value="24h">24 hours before check-in</option>
                    <option value="14h"> 14 hours before check-in</option>
                    <option value="6h">6 hours before check-in</option>
                    <option value="anytime">Free cancellation anytime</option>
                  </select>
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={cancellationPolicy.description}
                  onChange={(e) => setCancellationPolicy(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  style={styles.textarea}
                  placeholder="Enter detailed description of cancellation policy"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Terms and Conditions</label>
                <textarea
                  value={cancellationPolicy.terms}
                  onChange={(e) => setCancellationPolicy(prev => ({
                    ...prev,
                    terms: e.target.value
                  }))}
                  style={styles.textarea}
                  placeholder="Enter terms and conditions for cancellation"
                  required
                />
              </div>

              <button type="submit" style={styles.submitButton}>
                Save Cancellation Policy
              </button>
            </form>
          ) : (
            <div style={styles.cancellationView}>
              {boat.cancellationPolicy ? (
                <div style={styles.cancellationCard}>
                  <div style={styles.policyTypeHeader}>
                    <h3 style={styles.policyType}>
                      {boat.cancellationPolicy.type === 'free_cancellation' 
                        ? '✓ Free Cancellation' 
                        : '✕ No Free Cancellation'}
                    </h3>
                    {boat.cancellationPolicy.type === 'free_cancellation' && (
                      <div style={styles.freeWindow}>
                        {boat.cancellationPolicy.freeWindow === 'anytime' 
                          ? 'Available anytime'
                          : `Available up to ${boat.cancellationPolicy.freeWindow.replace('h', ' hours')} before check-in`
                        }
                      </div>
                    )}
                  </div>

                  <div style={styles.policyDetails}>
                    <div style={styles.policySection}>
                      <h4>Description</h4>
                      <p>{boat.cancellationPolicy.description}</p>
                    </div>

                    <div style={styles.policySection}>
                      <h4>Terms and Conditions</h4>
                      <p>{boat.cancellationPolicy.terms}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p style={styles.noDataMessage}>No cancellation policy set yet.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const locationStyles = {
  locationForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  searchContainer: {
    display: 'flex',
    gap: '10px',
  },
  searchButton: {
    padding: '10px 20px',
    backgroundColor: '#5e72e4',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  mapContainer: {
    border: '1px solid #ddd',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '20px',
  },
  locationView: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  addressDisplay: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
};

const securityStyles = {
  securityForm: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px',
  },
  securityView: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  securityCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  securityTitle: {
    margin: '0 0 15px 0',
    fontSize: '1.5rem',
    color: '#32325d',
  },
  securityDescription: {
    margin: '0 0 20px 0',
    color: '#525f7f',
  },
  documentSection: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fe',
    borderRadius: '5px',
  },
  documentLink: {
    display: 'inline-block',
    marginTop: '10px',
    padding: '8px 15px',
    backgroundColor: '#5e72e4',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '5px',
    fontSize: '0.875rem',
  },
  noDataMessage: {
    textAlign: 'center',
    color: '#525f7f',
    fontSize: '1rem',
    padding: '20px',
  },
};

const cancellationStyles = {
  cancellationForm: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fe',
    borderRadius: '10px',
  },
  radioOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  radioLabel: {
    fontSize: '1rem',
    color: '#32325d',
    cursor: 'pointer',
  },
  freeWindowSelect: {
    marginBottom: '20px',
  },
  cancellationView: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  cancellationCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  policyTypeHeader: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fe',
    borderRadius: '5px',
  },
  policyType: {
    margin: '0 0 10px 0',
    fontSize: '1.25rem',
    color: '#32325d',
  },
  freeWindow: {
    color: '#5e72e4',
    fontSize: '1rem',
    fontWeight: '500',
  },
  policyDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  policySection: {
    '& h4': {
      margin: '0 0 10px 0',
      color: '#32325d',
    },
    '& p': {
      margin: 0,
      color: '#525f7f',
      lineHeight: '1.5',
    },
  },
};

const additionalStyles = {
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
    padding: '10px',
  },
  editInput: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  editActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  saveButton: {
    padding: '6px 12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  cancelButton: {
    padding: '6px 12px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  editButton: {
    padding: '5px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#2196F3',
    cursor: 'pointer',
    fontSize: '16px',
  },
  amenityActions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  amenityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    borderRadius: '5px',
    backgroundColor: '#f8f9fe',
    marginBottom: '8px',
  },
  amenityContent: {
    flex: 1,
  },
  amenityName: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '500',
    color: '#32325d',
  },
  amenityDescription: {
    margin: '5px 0 0 0',
    fontSize: '0.9rem',
    color: '#525f7f',
  },
  amenitiesForm: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px',
  },
  foodForm: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px',
  },
  foodItemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    padding: '20px 0',
  },
  foodCard: {
    backgroundColor: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  foodImageContainer: {
    position: 'relative',
    height: '200px',
  },
  foodImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  foodCategory: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(94, 114, 228, 0.9)',
    color: 'white',
    padding: '5px 10px',
    borderRadius: '15px',
    fontSize: '0.875rem',
  },
  foodInfo: {
    padding: '20px',
  },
  foodName: {
    margin: '0 0 10px 0',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#32325d',
  },
  foodDescription: {
    margin: '0 0 15px 0',
    color: '#525f7f',
    fontSize: '0.875rem',
  },
  foodFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '15px',
    borderTop: '1px solid #e9ecef',
  },
  foodPrice: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#32325d',
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
  policyForm: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px',
  },
  policiesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  policySection: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  policyTypeTitle: {
    margin: '0 0 10px 0',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#32325d',
  },
  policyCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  policyCard: {
    backgroundColor: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  policyContent: {
    padding: '20px',
  },
  policyTitle: {
    margin: '0 0 10px 0',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#32325d',
  },
  policyPoints: {
    listStyleType: 'disc',
    paddingLeft: '20px',
    margin: '10px 0',
  },
  policyPoint: {
    color: '#525f7f',
    marginBottom: '5px',
  },
  policyActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '15px',
    borderTop: '1px solid #e9ecef',
  },
  pointContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
  },
  formActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  cancelButton: {
    padding: '15px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
  },
  editButton: {
    padding: '8px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  deleteButton: {
    padding: '8px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
};

const styles = {
  ...locationStyles,
  ...securityStyles,
  ...cancellationStyles,
  ...additionalStyles,
  navbar: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    padding: "10px",
    backgroundColor: "#333",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },
  navButton: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    padding: "10px 15px",
  },
  container: {
    padding: "40px 20px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  section: {
    margin: "50px 0",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "10px",
    backgroundColor: "#f9f9f9",
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  label: {
    fontWeight: '600',
    color: '#32325d',
  },
  input: {
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '16px',
  },
  textarea: {
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    minHeight: '100px',
    fontSize: '16px',
    resize: 'vertical',
  },
  imagePreviewContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '10px',
  },
  imagePreview: {
    position: 'relative',
    width: '150px',
    height: '150px',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '5px',
  },
  removeImageButton: {
    position: 'absolute',
    top: '5px',
    right: '5px',
    background: 'rgba(0,0,0,0.5)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '25px',
    height: '25px',
    cursor: 'pointer',
  },
  highlightContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    marginBottom: '10px',
  },
  addButton: {
    padding: '10px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  removeButton: {
    padding: '5px 10px',
    backgroundColor: '#ff4444',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  submitButton: {
    padding: '15px',
    backgroundColor: '#5e72e4',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
  },
  viewMode: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  imageGallery: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '15px',
  },
  galleryImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '5px',
  },
  contentSection: {
    marginBottom: '30px',
  },
  highlightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
  },
  highlightCard: {
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  editButton: {
    padding: '8px 20px',
    backgroundColor: '#5e72e4',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  amenitiesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    padding: '20px 0',
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '10px',
  },
  categoryIcon: {
    fontSize: '24px',
    color: '#5e72e4',
  },
  categoryTitle: {
    margin: 0,
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#32325d',
  },
  amenitiesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  amenityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    borderRadius: '5px',
    backgroundColor: '#f8f9fe',
    marginBottom: '8px',
  },
  amenityActions: {
    display: 'flex',
    gap: '8px',
    marginLeft: '10px',
  },
};

export default BoatDetails;
