import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './OwnerBoatsBookings.css';

const OwnerBoatsBookings = () => {
    const location = useLocation();
    const ownerId = location.state?.ownerId;
    const [boats, setBoats] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBoatsAndBookings = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/bookings/owner-boats-bookings?ownerId=${ownerId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }

                const data = await response.json();
                setBoats(data.boats);
                setBookings(data.bookings);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (ownerId) {
            fetchBoatsAndBookings();
        }
    }, [ownerId]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <h2>Your Boats and Bookings</h2>
            {boats.length === 0 ? (
                <p>No boats found.</p>
            ) : (
                <div>
                    <h3>Boats</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Boat Name</th>
                                <th>Type</th>
                                {/* <th>Status</th> */}
                            </tr>
                        </thead>
                        <tbody>
                            {boats.map(boat => (
                                <tr key={boat._id}>
                                    <td>{boat.boatName || 'Unknown'}</td>
                                    <td>{boat.boatType || 'Unknown'}</td>
                                    {/* <td>{boat.status}</td> */}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <h3>Bookings</h3>
                    {bookings.length === 0 ? (
                        <p>No bookings found for these boats.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Boat Name</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>People Count</th>
                                    <th>Total Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map(booking => (
                                    <tr key={booking._id}>
                                        <td>{boats.find(boat => boat._id === booking.boatId)?.boatName || 'Unknown'}</td>
                                        <td>{new Date(booking.startDate).toLocaleDateString()}</td>
                                        <td>{new Date(booking.endDate).toLocaleDateString()}</td>
                                        <td>{booking.adults}</td>
                                        <td>Rs.{booking.totalAmount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default OwnerBoatsBookings;

