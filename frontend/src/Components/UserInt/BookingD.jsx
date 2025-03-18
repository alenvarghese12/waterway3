import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation
import './BookingD.css'; // Import the CSS file for styling

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
                        src={booking.boatImage ? `https://waterway3.onrender.com/uploads/${booking.boatImage}` : '/default-boat.png'} 
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
                        src={booking.boatImage ? `https://waterway3.onrender.com/uploads/${booking.boatImage}` : '/default-boat.png'} 
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

    useEffect(() => {
        const fetchBookingDetails = async () => {
            try {
                if (!userId) {
                    throw new Error('User ID is not available');
                }
                console.log('Fetching bookings for User ID:', userId); // Log the user ID
                const response = await fetch(`https://waterway3.onrender.com/api/bookings/user/${userId}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch booking details');
                }
                
                const data = await response.json();
                console.log('Fetched booking details:', data); // Log the fetched booking details
                setBookings(data);

                // Fetch user details to get the name
                const userResponse = await fetch(`https://waterway3.onrender.com/api/auth/user/${userId}`);
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

    const handleCancelBooking = async (bookingId) => {
        try {
            const response = await fetch(`https://waterway3.onrender.com/api/bookings/${bookingId}/cancel`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
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
        } catch (error) {
            setError('Failed to cancel booking: ' + error.message);
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
                                    onCancel={handleCancelBooking}
                                />;
                            } else {
                                // For cancelled bookings, use the same design as completed
                                return <CompletedBookingCard key={booking._id} booking={booking} />;
                            }
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingD;
