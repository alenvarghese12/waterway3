import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { FaFilter, FaTimes } from 'react-icons/fa';

const UserBoatList = () => {
  const [boats, setBoats] = useState([]);
  const [filteredBoats, setFilteredBoats] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [filters, setFilters] = useState({
    boatType: 'all',
    priceRange: 'all',
    capacity: 'all'
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const navigate = useNavigate();
  const { userDetails } = useOutletContext();

  useEffect(() => {
    fetchBoats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [boats, filters]);

  const fetchBoats = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/boats/boatsd');
      setBoats(response.data);
      setFilteredBoats(response.data);
    } catch (error) {
      console.error('Failed to fetch boats', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...boats];

    // Apply type filter
    if (filters.boatType !== 'all') {
      filtered = filtered.filter(boat => boat.boatType === filters.boatType);
    }

    // Apply price range filter
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter(boat => 
        boat.price >= min && (max ? boat.price <= max : true)
      );
    }

    // Apply capacity filter
    if (filters.capacity !== 'all') {
      const [min, max] = filters.capacity.split('-').map(Number);
      filtered = filtered.filter(boat => 
        boat.capacity >= min && (max ? boat.capacity <= max : true)
      );
    }

    setFilteredBoats(filtered);
  };

  const handleViewDetails = (boat) => {
    if (userDetails && userDetails.id && userDetails.name && userDetails.email) {
      navigate('/userint/boatviewdetails', { 
        state: { 
          boat, 
          userDetails: {
            id: userDetails.id,
            name: userDetails.name,
            email: userDetails.email
          }
        } 
      });
    } else {
      console.error('User details not available or incomplete');
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const formatLocation = (location) => {
    if (!location) return 'Available';
    return `${location.place}, ${location.district}, ${location.pincode}, ${location.state}`;
  };
  return (
    <div style={styles.mainContent}>
      <div style={styles.contentContainer}>
        {/* Sidebar Filters */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarCard}>
            <h4 style={styles.sidebarTitle}>Choose Filters</h4>
            
            {/* Boat Type Filter */}
            <div style={styles.filterSection}>
              <h5 style={styles.filterTitle}>Boat Type</h5>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="boatType"
                    value="all"
                    checked={filters.boatType === 'all'}
                    onChange={(e) => setFilters({...filters, boatType: e.target.value})}
                    style={styles.radioInput}
                  />
                  <span style={styles.radioText}>All Types</span>
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="boatType"
                    value="Speed Boat"
                    checked={filters.boatType === 'Speed Boat'}
                    onChange={(e) => setFilters({...filters, boatType: e.target.value})}
                    style={styles.radioInput}
                  />
                  <span style={styles.radioText}>Speed Boat</span>
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="boatType"
                    value="House Boat"
                    checked={filters.boatType === 'House Boat'}
                    onChange={(e) => setFilters({...filters, boatType: e.target.value})}
                    style={styles.radioInput}
                  />
                  <span style={styles.radioText}>House Boat</span>
                </label>
              </div>
            </div>

            {/* Price Range Filter */}
            <div style={styles.filterSection}>
              <h5 style={styles.filterTitle}>Price Range</h5>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="priceRange"
                    value="all"
                    checked={filters.priceRange === 'all'}
                    onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
                    style={styles.radioInput}
                  />
                  <span style={styles.radioText}>All Prices</span>
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="priceRange"
                    value="1000-10000"
                    checked={filters.priceRange === '1000-10000'}
                    onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
                    style={styles.radioInput}
                  />
                  <span style={styles.radioText}>₹1,000 - ₹10,000</span>
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="priceRange"
                    value="10001-25000"
                    checked={filters.priceRange === '10001-25000'}
                    onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
                    style={styles.radioInput}
                  />
                  <span style={styles.radioText}>₹10,001 - ₹25,000</span>
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="priceRange"
                    value="25001-50000"
                    checked={filters.priceRange === '25001-50000'}
                    onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
                    style={styles.radioInput}
                  />
                  <span style={styles.radioText}>₹25,001 - ₹50,000</span>
                </label>
              </div>
            </div>

            {/* Capacity Filter */}
            <div style={styles.filterSection}>
              <h5 style={styles.filterTitle}>Capacity</h5>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="capacity"
                    value="all"
                    checked={filters.capacity === 'all'}
                    onChange={(e) => setFilters({...filters, capacity: e.target.value})}
                    style={styles.radioInput}
                  />
                  <span style={styles.radioText}>Any Capacity</span>
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="capacity"
                    value="1-5"
                    checked={filters.capacity === '1-5'}
                    onChange={(e) => setFilters({...filters, capacity: e.target.value})}
                    style={styles.radioInput}
                  />
                  <span style={styles.radioText}>1-5 People</span>
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="capacity"
                    value="6-12"
                    checked={filters.capacity === '6-12'}
                    onChange={(e) => setFilters({...filters, capacity: e.target.value})}
                    style={styles.radioInput}
                  />
                  <span style={styles.radioText}>6-12 People</span>
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="capacity"
                    value="13-18"
                    checked={filters.capacity === '13-18'}
                    onChange={(e) => setFilters({...filters, capacity: e.target.value})}
                    style={styles.radioInput}
                  />
                  <span style={styles.radioText}>13-18 People</span>
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="capacity"
                    value="19-30"
                    checked={filters.capacity === '19-30'}
                    onChange={(e) => setFilters({...filters, capacity: e.target.value})}
                    style={styles.radioInput}
                  />
                  <span style={styles.radioText}>19-30 People</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={styles.mainArea}>
          <h2 style={styles.pageTitle}>Available Boats</h2>
          <div style={styles.boatsContainer}>
            <div style={styles.boatsGrid}>
              {filteredBoats.length > 0 ? (
                filteredBoats.map((boat) => (
                  <div key={boat._id} style={styles.boatCard}>
                    <div style={styles.boatImageContainer}>
                      <img
                        src={`http://localhost:8080/uploads/${boat.image}`}
                        alt={boat.boatName}
                        style={styles.boatImage}
                        onClick={() => handleImageClick(`http://localhost:8080/uploads/${boat.image}`)}
                      />
                      <div style={styles.boatType}>{boat.boatType}</div>
                    </div>
                    <div style={styles.boatInfo}>
                      <div>
                        <h3 style={styles.boatName}>{boat.boatName}</h3>
                        <div style={styles.boatDetails}>
                          <div style={styles.detailRow}>
                            <span>👥 Capacity: {boat.capacity} people</span>
                          </div>
                          <div style={styles.detailRow}>
                            <span>➤ Location: {formatLocation(boat.location)}</span>
                          </div>
                          <div style={styles.detailRow}>
                            <span>⭐ Rating: {boat.rating || '4.5'}/5</span>
                          </div>
                        </div>
                      </div>
                      <div style={styles.actionArea}>
                        <div style={styles.priceTag}>
                          ₹{boat.price}/day
                        </div>
                        <button 
                          style={styles.viewButton}
                          onClick={() => handleViewDetails(boat)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.noResultsContainer}>
                  <div style={styles.noResultsMessage}>
                    {filters.boatType !== 'all' && (
                      <p>Sorry, no {filters.boatType}s are available</p>
                    )}
                    {filters.priceRange !== 'all' && (
                      <p>
                        Sorry, no boats available in price range 
                        {filters.priceRange === '1000-10000' && ' ₹1,000 - ₹10,000'}
                        {filters.priceRange === '10001-25000' && ' ₹10,001 - ₹25,000'}
                        {filters.priceRange === '25001-50000' && ' ₹25,001 - ₹50,000'}
                      </p>
                    )}
                    {filters.capacity !== 'all' && (
                      <p>
                        Sorry, no boats available with capacity 
                        {filters.capacity === '1-5' && ' 1-5 people'}
                        {filters.capacity === '6-12' && ' 6-12 people'}
                        {filters.capacity === '13-18' && ' 13-18 people'}
                        {filters.capacity === '19-30' && ' 19-30 people'}
                      </p>
                    )}
                    {filters.boatType === 'all' && 
                     filters.priceRange === 'all' && 
                     filters.capacity === 'all' && (
                      <p>Sorry, no boats are currently available</p>
                    )}
                  </div>
                  <button 
                    style={styles.resetButton}
                    onClick={() => setFilters({
                      boatType: 'all',
                      priceRange: 'all',
                      capacity: 'all'
                    })}
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {isModalOpen && (
        <div style={styles.modal} onClick={closeModal}>
          <button style={styles.modalClose} onClick={closeModal}>
            <FaTimes />
          </button>
          <img style={styles.modalImage} src={selectedImage} alt="Zoomed" />
        </div>
      )}
    </div>
  );
};

const styles = {
  mainContent: {
    backgroundColor: '#f8f9fe',
    minHeight: '100vh',
    marginTop: '200px',
  },
  header: {
    position: 'relative',
    padding: '8rem 0 8rem 0',
    backgroundImage: 'url(https://images.unsplash.com/photo-1540946485063-a40da27545f8?ixlib=rb-4.0.3)',
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
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: '3rem',
    fontWeight: '600',
    marginBottom: '1rem',
  },
  headerText: {
    fontSize: '1.25rem',
    opacity: '0.8',
  },
  filterSection: {
    marginBottom: '30px',
  },
  filterTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#32325d',
    marginBottom: '15px',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    '&:hover': {
      color: '#5e72e4',
    },
  },
  radioInput: {
    cursor: 'pointer',
    marginRight: '10px',
    width: '16px',
    height: '35px',
    accentColor: '#5e72e4', // For modern browsers
  },
  radioText: {
    fontSize: '1.1rem',
    color: '#525f7f',
   
  },
  boatsContainer: {
    padding: '40px 30px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  boatsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
  },
  boatCard: {
    backgroundColor: 'white',
    borderRadius: '15px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(50, 50, 93, 0.1)',
    transition: 'transform 0.2s ease',
    display: 'flex',
    width: '100%',
    height: '350px',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 4px 12px rgba(50, 50, 93, 0.15)',
    },
  },
  boatImageContainer: {
    position: 'relative',
    width: '350px',
    minWidth: '350px',
    height: '100%',
  },
  boatImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  boatType: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    backgroundColor: 'rgba(94, 114, 228, 0.9)',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  boatInfo: {
    flex: 1,
    padding: '25px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  boatName: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#32325d',
    marginBottom: '10px',
  },
  boatDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: 'auto',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#525f7f',
    fontSize: '1rem',
  },
  actionArea: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #e9ecef',
  },
  priceTag: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#32325d',
  },
  viewButton: {
    padding: '12px 30px',
    backgroundColor: '#5e72e4',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#324cdd',
      transform: 'translateY(-1px)',
    },
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalClose: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
  },
  modalImage: {
    maxWidth: '90%',
    maxHeight: '90vh',
    objectFit: 'contain',
  },
  contentContainer: {
    
    display: 'flex',
    gap: '30px',
    padding: '30px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  sidebar: {
    marginTop: '100px',
    width: '280px',
    minWidth: '280px',
    position: 'sticky',
    top: '30px',
    height: 'fit-content',
  },
  sidebarCard: {
    marginTop: '100px',
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '25px',
    boxShadow: '0 2px 4px rgba(50, 50, 93, 0.1)',
  },
  sidebarTitle: {
    fontSize: '2.1rem',
    fontWeight: '600',
    color: '#32325d',
    marginBottom: '35px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e9ecef',
  },
  mainArea: {
    flex: 1,
    marginTop: '800px',
  },
  pageTitle: {
    fontSize: '1.85rem',
    fontWeight: '600',
    color: '#32325d',
    marginBottom: '30px',
  },
  '@media (max-width: 1024px)': {
    contentContainer: {
      flexDirection: 'column',
    },
    sidebar: {
      width: '100%',
      position: 'static',
    },
    boatCard: {
      flexDirection: 'column',
      height: 'auto',
    },
    boatImageContainer: {
      width: '100%',
      height: '200px',
    },
  },
  noResultsContainer: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '15px',
    boxShadow: '0 2px 4px rgba(50, 50, 93, 0.1)',
  },
  noResultsMessage: {
    marginBottom: '20px',
    color: '#32325d',
    fontSize: '1.1rem',
    lineHeight: '1.6',
  },
  resetButton: {
    padding: '12px 30px',
    backgroundColor: '#5e72e4',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#324cdd',
      transform: 'translateY(-1px)',
    },
  },
};

export default UserBoatList;