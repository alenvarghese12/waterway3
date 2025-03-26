import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation
import './BookingD.css'; // Import the CSS file for styling

// Add CancellationModal component
const CancellationModal = ({ isOpen, onClose, onConfirm, bookingId }) => {
    const [reason, setReason] = useState('');
    
    if (!isOpen) return null;
    
    return (
        <div className="modal-overlay">
            <div className="cancellation-modal">
                <h3>Confirm Cancellation</h3>
                <p>Are you sure you want to cancel this booking?</p>
                <p className="modal-warning">This action cannot be undone.</p>
                
                <div className="reason-input">
                    <label htmlFor="cancellation-reason">Please provide a reason for cancellation:</label>
                    <textarea 
                        id="cancellation-reason"
                        rows="3"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Enter reason for cancellation (optional)"
                    />
                </div>
                
                <div className="modal-buttons">
                    <button 
                        className="cancel-button"
                        onClick={onClose}
                    >
                        Keep Booking
                    </button>
                    <button 
                        className="confirm-button"
                        onClick={() => onConfirm(bookingId, reason)}
                    >
                        Confirm Cancellation
                    </button>
                </div>
            </div>
        </div>
    );
};

const CompletedBookingCard = ({ booking }) => {
    return (
        <div className="completed-booking-card">
            <div className="booking-header">
                <div className="booking-status">
                    <span className="status-badge completed">Completed</span>
                    <span className="booking-date">
                        {new Date(booking.endDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </span>
                </div>
                <div className="booking-id">
                    Booking ID: {booking._id}
                </div>
            </div>
            
            <div className="booking-content">
                <div className="boat-image">
                    <img 
                        src={booking.boatImage ? `http://localhost:8080/uploads/${booking.boatImage}` : '/default-boat.png'} 
                        alt={booking.boatName || 'Boat'} 
                    />
                </div>
                <div className="booking-details">
                    <h3 className="boat-name">{booking.boatName || 'Unnamed Boat'}</h3>
                    <div className="detail-row">
                        <span className="label">Check-in:</span>
                        <span className="value">
                            {new Date(booking.startDate).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Check-out:</span>
                        <span className="value">
                            {new Date(booking.endDate).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Duration:</span>
                        <span className="value">
                            {Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24))} days
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Total Amount:</span>
                        <span className="value price">₹{booking.totalAmount}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Create a new component for upcoming bookings with similar styling to completed
const UpcomingBookingCard = ({ booking, onCancel }) => {
    return (
        <div className="completed-booking-card">
            <div className="booking-header">
                <div className="booking-status">
                    <span className="status-badge upcoming">Upcoming</span>
                    <span className="booking-date">
                        {new Date(booking.startDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </span>
                </div>
                <div className="booking-id">
                    Booking ID: {booking._id}
                </div>
            </div>
            
            <div className="booking-content">
                <div className="boat-image">
                    <img 
                        src={booking.boatImage ? `http://localhost:8080/uploads/${booking.boatImage}` : '/default-boat.png'} 
                        alt={booking.boatName || 'Boat'} 
                    />
                </div>
                <div className="booking-details">
                    <h3 className="boat-name">{booking.boatName || 'Unnamed Boat'}</h3>
                    <div className="detail-row">
                        <span className="label">Check-in:</span>
                        <span className="value">
                            {new Date(booking.startDate).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Check-out:</span>
                        <span className="value">
                            {new Date(booking.endDate).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Duration:</span>
                        <span className="value">
                            {Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24))} days
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Total Amount:</span>
                        <span className="value price">₹{booking.totalAmount}</span>
                    </div>
                    <button 
                        className="cancel-booking-button"
                        onClick={() => onCancel(booking._id)}
                    >
                        Cancel Booking
                    </button>
                </div>
            </div>
        </div>
    );
};

const BookingD = () => {
    const location = useLocation(); // Get the location object
    const userId = location.state?.userDetails?.id; // Extract user ID from location state
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [userName, setUserName] = useState('');
    
    // Add state for cancellation modal
    const [showCancellationModal, setShowCancellationModal] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);

    useEffect(() => {
        const fetchBookingDetails = async () => {
            try {
                if (!userId) {
                    throw new Error('User ID is not available');
                }
                console.log('Fetching bookings for User ID:', userId); // Log the user ID
                const response = await fetch(`http://localhost:8080/api/bookings/user/${userId}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch booking details');
                }
                
                const data = await response.json();
                console.log('Fetched booking details:', data); // Log the fetched booking details
                setBookings(data);

                // Fetch user details to get the name
                const userResponse = await fetch(`http://localhost:8080/api/auth/user/${userId}`);
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    setUserName(userData.name);
                }
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBookingDetails();
    }, [userId]); // Add userId as a dependency

    // Modified to show modal when cancel is clicked
    const handleCancelClick = (bookingId) => {
        setSelectedBookingId(bookingId);
        setShowCancellationModal(true);
    };
    
    // Close the modal without taking action
    const handleCloseModal = () => {
        setShowCancellationModal(false);
        setSelectedBookingId(null);
    };

    // Actual cancellation function with reason
    const handleCancelBooking = async (bookingId, cancellationReason) => {
        try {
            // First, find the booking details from local state
            const bookingToCancel = bookings.find(booking => booking._id === bookingId);
            if (!bookingToCancel) {
                throw new Error('Booking not found in local state');
            }
            
            // Calculate additional info for fraud detection
            const now = new Date();
            const startDate = new Date(bookingToCancel.startDate);
            const leadTime = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
            
            // Get information about user's device for fraud detection
            const userAgent = navigator.userAgent;
            
            console.log(`Cancelling booking ${bookingId}, lead time: ${leadTime} days`);
            console.log(`Cancellation reason: ${cancellationReason}`);
            
            const response = await fetch(`http://localhost:8080/api/bookings/${bookingId}/cancel`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // Extra details for fraud detection
                    deviceInfo: userAgent,
                    cancelTime: now.toISOString(),
                    leadTime: leadTime,
                    cancellationReason: cancellationReason || 'No reason provided'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to cancel booking');
            }

            // Update the local state to reflect the cancellation
            setBookings(bookings.map(booking => 
                booking._id === bookingId 
                    ? { ...booking, status: 'cancelled' }
                    : booking
            ));
            
            // Reset modal state
            setShowCancellationModal(false);
            setSelectedBookingId(null);
            
            // Check if this was the user's first cancellation - if so, show helpful message
            const userCancellations = bookings.filter(b => b.status === 'cancelled').length;
            if (userCancellations === 0) {
                // This is the user's first cancelled booking (after the current cancellation)
                alert('Your booking has been successfully cancelled. If you need assistance with refunds, please contact customer support.');
            }
        } catch (error) {
            setError('Failed to cancel booking: ' + error.message);
            // Reset modal state on error too
            setShowCancellationModal(false);
            setSelectedBookingId(null);
        }
    };

    const filterBookings = (type) => {
        const currentDate = new Date();
        
        switch(type) {
            case 'upcoming':
                return bookings.filter(booking => {
                    const endDate = new Date(booking.endDate);
                    return endDate >= currentDate && booking.status !== 'cancelled';
                });
            case 'completed':
                return bookings.filter(booking => {
                    const endDate = new Date(booking.endDate);
                    return endDate < currentDate && booking.status !== 'cancelled';
                });
            case 'cancelled':
                return bookings.filter(booking => booking.status === 'cancelled');
            default:
                return [];
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    const filteredBookings = filterBookings(activeTab);

    return (
        <div className="bookings-container">
            <div className="bookings-header">
                <h1>My bookings</h1>
                <div className="tabs-container">
                    <div className="tabs">
                        <button 
                            className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
                            onClick={() => setActiveTab('upcoming')}
                        >
                            Upcoming
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
                            onClick={() => setActiveTab('completed')}
                        >
                            Completed
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'cancelled' ? 'active' : ''}`}
                            onClick={() => setActiveTab('cancelled')}
                        >
                            Cancelled
                        </button>
                    </div>
                </div>
            </div>

            <div className="bookings-content">
                {filteredBookings.length === 0 ? (
                    <div className="no-bookings">
                        <div className="empty-state-image">
                            <img src="/path-to-your-empty-state-image.png" alt="No trips" />
                        </div>
                        <p className="empty-message">
                            {userName}, you have no {activeTab} trips
                        </p>
                    </div>
                ) : (
                    <div className={`bookings-list ${activeTab}`}>
                        {filteredBookings.map((booking) => {
                            if (activeTab === 'completed') {
                                return <CompletedBookingCard key={booking._id} booking={booking} />;
                            } else if (activeTab === 'upcoming') {
                                return <UpcomingBookingCard 
                                    key={booking._id} 
                                    booking={booking} 
                                    onCancel={handleCancelClick}
                                />;
                            } else {
                                // For cancelled bookings, use the same design as completed
                                return <CompletedBookingCard key={booking._id} booking={booking} />;
                            }
                        })}
                    </div>
                )}
            </div>
            
            {/* Cancellation confirmation modal */}
            <CancellationModal
                isOpen={showCancellationModal}
                onClose={handleCloseModal}
                onConfirm={handleCancelBooking}
                bookingId={selectedBookingId}
            />
        </div>
    );
};

export default BookingD;
