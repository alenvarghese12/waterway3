import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaUser, FaCog, FaCalendar, FaSignOutAlt } from 'react-icons/fa';

const UserProfile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    profilePicture: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    bio: '',
    city: '',
    country: '',
    postalCode: ''
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('https://waterway3.onrender.com/api/auth/sessionn', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const user = await response.json();
      setUserData({
        ...userData,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        profilePicture: user.profilePicture || '',
        bio: user.bio || '',
        city: user.city || '',
        country: user.country || '',
        postalCode: user.postalCode || ''
      });
      setLoading(false);
    } catch (err) {
      setError('Failed to load user data');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size should be less than 5MB');
        return;
      }
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const formData = new FormData();
      formData.append('name', userData.name);
      formData.append('email', userData.email);
      formData.append('phone', userData.phone);
      formData.append('address', userData.address);
      formData.append('city', userData.city);
      formData.append('country', userData.country);
      formData.append('postalCode', userData.postalCode);
      formData.append('bio', userData.bio);
      
      if (profileImage) {
        formData.append('profilePicture', profileImage);
      }

      // Only include password fields if they are filled
      if (userData.currentPassword && userData.newPassword) {
        if (userData.newPassword !== userData.confirmPassword) {
          setError('New passwords do not match');
          return;
        }
        formData.append('currentPassword', userData.currentPassword);
        formData.append('newPassword', userData.newPassword);
      }

      const response = await fetch('https://waterway3.onrender.com/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setIsEditing(false);
      alert('Profile updated successfully!');
      // Reset password fields
      setUserData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div style={styles.loadingContainer}>Loading...</div>;
  }

  return (
    <div style={styles.mainContent}>
      {/* Top Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.navContainer}>
          <h4 style={styles.navBrand}>User Profile</h4>
          
          <div style={styles.navRight}>
            <div style={styles.searchBar}>
              <input type="text" placeholder="Search" style={styles.searchInput} />
              <FaSearch style={styles.searchIcon} />
            </div>
            
            <div style={styles.userDropdown}>
              <img 
                src={userData.profilePicture || '/default-avatar.png'} 
                alt="Profile" 
                style={styles.navProfilePic}
              />
              <span style={styles.userName}>{userData.name}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <div style={styles.header}>
        <div style={styles.headerOverlay}></div>
        <div style={styles.headerContent}>
          <h1 style={styles.headerTitle}>Hello {userData.name}</h1>
          <p style={styles.headerText}>
            This is your profile page. You can see and update your information here.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.contentContainer}>
        <div style={styles.contentGrid}>
          {/* Profile Card */}
          <div style={styles.profileCard}>
            <div style={styles.profileImageContainer}>
              <img
                src={imagePreview || userData.profilePicture || '/default-avatar.png'}
                alt="Profile"
                style={styles.profileImage}
              />
              {isEditing && (
                <div style={styles.imageUpload}>
                  <label htmlFor="profilePicture" style={styles.uploadButton}>
                    {userData.profilePicture ? 'Change Photo' : 'Upload Photo'}
                  </label>
                  <input
                    type="file"
                    id="profilePicture"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={styles.hiddenInput}
                  />
                </div>
              )}
            </div>

            <div style={styles.profileStats}>
              <div style={styles.statItem}>
                <span style={styles.statNumber}>22</span>
                <span style={styles.statLabel}>Orders</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statNumber}>10</span>
                <span style={styles.statLabel}>Reviews</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statNumber}>89</span>
                <span style={styles.statLabel}>Visits</span>
              </div>
            </div>

            <div style={styles.profileInfo}>
              <h3 style={styles.profileName}>{userData.name}</h3>
              <div style={styles.profileLocation}>
                <i className="ni location_pin mr-2"></i>
                {userData.address || 'No address added'}
              </div>
              <hr style={styles.divider} />
              <p style={styles.profileBio}>
                {userData.bio || 'No bio added yet.'}
              </p>
            </div>
          </div>

          {/* Edit Form Card */}
          <div style={styles.formCard}>
            <div style={styles.formHeader}>
              <h3 style={styles.formTitle}>My Account</h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  style={styles.editButton}
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              {/* Personal Information */}
              <h6 style={styles.sectionTitle}>Personal Information</h6>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={userData.email}
                    disabled={true}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={userData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Address Information */}
              <h6 style={styles.sectionTitle}>Address Information</h6>
              <div style={styles.formGrid}>
                <div style={styles.formGroupFull}>
                  <label style={styles.label}>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={userData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>City</label>
                  <input
                    type="text"
                    name="city"
                    value={userData.city}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Country</label>
                  <input
                    type="text"
                    name="country"
                    value={userData.country}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={userData.postalCode}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    style={styles.input}
                  />
                </div>
              </div>

              {/* About Me */}
              <h6 style={styles.sectionTitle}>About Me</h6>
              <div style={styles.formGroupFull}>
                <textarea
                  name="bio"
                  value={userData.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={styles.textarea}
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              </div>

              {isEditing && (
                <div style={styles.formActions}>
                  <button type="submit" style={styles.saveButton}>
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  mainContent: {
    backgroundColor: '#f8f9fe',
    minHeight: '100vh',
  },
  navbar: {
    backgroundColor: '#5e72e4',
    padding: '1rem 0',
    position: 'relative',
  },
  navContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 30px',
  },
  navBrand: {
    color: 'white',
    margin: 0,
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  searchBar: {
    position: 'relative',
  },
  searchInput: {
    padding: '8px 15px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    width: '200px',
  },
  header: {
    position: 'relative',
    padding: '8rem 0 8rem 0',
    backgroundImage: 'url(https://raw.githubusercontent.com/creativetimofficial/argon-dashboard/gh-pages/assets-old/img/theme/profile-cover.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(94, 114, 228, 0.8)',
  },
  headerContent: {
    position: 'relative',
    padding: '0 30px',
    color: 'white',
  },
  contentContainer: {
    margin: '-150px auto 0',
    padding: '0 30px',
    maxWidth: '1200px',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '30px',
    '@media (max-width: 992px)': {
      gridTemplateColumns: '1fr',
    },
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '30px',
    width: '100%',
    maxWidth: '800px',
    margin: '20px auto',
    '@media (max-width: 768px)': {
      padding: '20px',
    },
  },
  profileImageContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  profileImage: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  profileStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '20px',
  },
  statItem: {
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
  },
  profileInfo: {
    textAlign: 'center',
  },
  profileName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '10px',
  },
  profileLocation: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #ddd',
    margin: '20px 0',
  },
  profileBio: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '30px',
    width: '100%',
    maxWidth: '800px',
    margin: '20px auto',
    '@media (max-width: 768px)': {
      padding: '20px',
    },
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  formTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    '&:disabled': {
      backgroundColor: '#f5f5f5',
      cursor: 'not-allowed',
    },
    '&:focus': {
      outline: 'none',
      borderColor: '#4CAF50',
      boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.1)',
    },
  },
  formGroupFull: {
    gridColumn: 'span 2',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    resize: 'vertical',
    minHeight: '80px',
    fontFamily: 'inherit',
    '&:disabled': {
      backgroundColor: '#f5f5f5',
      cursor: 'not-allowed',
    },
    '&:focus': {
      outline: 'none',
      borderColor: '#4CAF50',
      boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.1)',
    },
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },
  editButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '12px 30px',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#45a049',
    },
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #ddd',
    padding: '12px 30px',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#e5e5e5',
    },
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '12px 30px',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#45a049',
    },
  },
  imageUpload: {
    position: 'absolute',
    bottom: '0',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    display: 'inline-block',
    marginTop: '10px',
    '&:hover': {
      backgroundColor: '#45a049',
      transform: 'translateY(-1px)',
    },
  },
  hiddenInput: {
    display: 'none',
  },
  userDropdown: {
    position: 'relative',
  },
  navProfilePic: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
  },
  searchIcon: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'white',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '18px',
    color: '#666',
  },
};

 
export default UserProfile; 