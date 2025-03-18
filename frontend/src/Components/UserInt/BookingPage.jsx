import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './BookingPage.css';

const BookingPage = () => {
  const location = useLocation();
  const { boat } = location.state; // Receiving the boat data passed from the previous page

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const [reservationStatus, setReservationStatus] = useState(''); // To handle reservation status

  // Validate dates
  const validateDates = () => {
    if (boat.boatType === 'speed boat') return true; // No date validation for speed boats
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start < end && !isNaN(start) && !isNaN(end); // Valid if start is before end
  };

  // Calculate the price per head based on the boat type
  const calculatePricePerHead = () => {
    if (peopleCount <= 0 || !validateDates()) return 0; // Avoid invalid cases

    let duration = 1; // Default for speed boats (1-hour booking)
    
    if (boat.boatType !== 'speed boat') {
      const start = new Date(startDate);
      const end = new Date(endDate);
      duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)); // Calculate days
    }

    return (boat.price / peopleCount / duration).toFixed(2); // Price per head
  };

  // Handle reservation
  const handleReservation = () => {
    if (validateDates()) {
      setReservationStatus('Reservation confirmed!'); // Show success message
    } else {
      setReservationStatus('Please select valid dates!'); // Show error message
    }
  };

  // Handle booking confirmation
  const handleBooking = () => {
    if (validateDates() && peopleCount > 0) {
      alert('Booking Confirmed!');
      // Proceed with booking API or other logic
    }
  };

  return (
    <div className="booking-page">
      <h2>Booking for {boat.boatName}</h2>

      {/* Display date inputs for non-speed boats */}
      {boat.boatType !== 'speed boat' ? (
        <>
          <label>Start Date:</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
          <label>End Date:</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
          />
        </>
      ) : (
        <p>This is a 1-hour booking for a speed boat.</p>
      )}

      <label>Number of People:</label>
      <input
        type="number"
        value={peopleCount}
        onChange={(e) => setPeopleCount(e.target.value)}
        min="1"
      />

      <p>Average Price per Head: Rs. {calculatePricePerHead()}</p>

      {/* Reservation button */}
      <button className="reservation-button" onClick={handleReservation}>
        Reserve
      </button>
      {reservationStatus && <p className="reservation-status">{reservationStatus}</p>}

      {/* Booking button, only enabled if inputs are valid */}
      <button 
        className="confirm-booking-button"
        onClick={handleBooking}
        disabled={!validateDates() || peopleCount <= 0}
      >
        Confirm Booking
      </button>
    </div>
  );
};

export default BookingPage;
