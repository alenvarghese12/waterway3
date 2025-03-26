import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Button, Row, Col, Badge, Form, Alert, Spinner, Table } from 'react-bootstrap';

// Component to display Python service status
const PythonServiceInfo = ({ onClick, serviceStatusData }) => (
  <Card className="mb-4">
    {/* <Card.Header className="bg-info text-white">ML Service Status</Card.Header>
    <Card.Body>
      <p>The ML service appears to be unavailable. This could be because:</p>
      <ol>
        <li>The Python ML service is not running</li>
        <li>There's a connection issue between the backend and the Python service</li>
      </ol>
      <p>The system is currently using rule-based detection as a fallback.</p>
      {serviceStatusData && (
        <Alert variant="info">
          <strong>Last check:</strong> {new Date(serviceStatusData.lastChecked).toLocaleString()}<br/>
          <strong>Error:</strong> {serviceStatusData.errorMessage || 'Connection refused'}
        </Alert>
      )} */}
      <div className="d-flex gap-2">
        {/* <Button variant="primary" onClick={onClick}>
          Setup Instructions
        </Button> */}
        <Button variant="outline-primary" onClick={() => window.location.reload()}>
          Check Again
        </Button>
      </div>
    {/* </Card.Body> */}
  </Card>
);

const Frauddetect = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState('');
  const [fraudAnalysis, setFraudAnalysis] = useState(null);
  const [hotelComparison, setHotelComparison] = useState(null);
  const [searchType, setSearchType] = useState('userId');
  const [bookingId, setBookingId] = useState('');
  const [flaggedUsers, setFlaggedUsers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [serviceStatusData, setServiceStatusData] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [fraudProfiles, setFraudProfiles] = useState([]);

  // Fetch flagged users on component mount
  useEffect(() => {
    fetchFraudStatistics();
    checkPythonServiceStatus();
    fetchFraudProfiles();
  }, []);

  const fetchFraudStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:8080/api/book/fraud-profiles');
      console.log('Fetched fraud profiles:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        // Transform the fraud profiles into flagged users format with detailed risk information
        const transformedUsers = response.data.map(profile => {
          // Calculate risk factors based on profile data
          const riskFactors = [];
          let riskScore = 0;
          
          // 1. Recent Cancellation Patterns (40% weight)
          if (profile.cancellationsLast24Hours >= 2) {
            riskFactors.push(`${profile.cancellationsLast24Hours} cancellations in last 24 hours`);
            riskScore += 20;
          }
          if (profile.cancellationsLast7Days >= 5) {
            riskFactors.push(`${profile.cancellationsLast7Days} cancellations in last 7 days`);
            riskScore += 20;
          }
          
          // 2. Overall Cancellation History (30% weight)
          const cancellationRatioPercent = (profile.cancellationRatio * 100);
          if (cancellationRatioPercent > 15) {
            riskFactors.push(`High cancellation ratio (${cancellationRatioPercent.toFixed(1)}%)`);
            riskScore += Math.min(30, cancellationRatioPercent / 2); // Cap at 30 points
          }
          
          // 3. Booking Patterns (30% weight)
          if (profile.averageLeadTime < 0) {
            riskFactors.push('Suspicious lead time patterns');
            riskScore += 10;
          }
          
          if (profile.distinctBoatsBooked > 5 && profile.distinctBoatsCancelled > 0) {
            riskFactors.push(`Booked ${profile.distinctBoatsBooked} different boats with cancellations`);
            riskScore += 10;
          }
          
          if (profile.shortLeadTimeBookings > 3) {
            riskFactors.push(`${profile.shortLeadTimeBookings} bookings with very short lead time`);
            riskScore += 10;
          }
          
          // Additional Risk Factors
          if (profile.averageTimeBetweenCancellations && profile.averageTimeBetweenCancellations < 24) {
            riskFactors.push('Frequent cancellations within short time periods');
            riskScore += 10;
          }
          
          if (profile.passengerVariance > 2) {
            riskFactors.push('Highly variable passenger counts across bookings');
            riskScore += 5;
          }
          
          // Cap the risk score at 100
          riskScore = Math.min(Math.round(riskScore), 100);
          
          // Determine if user should be flagged based on key metrics
          const shouldFlag = 
            profile.cancellationsLast24Hours >= 2 ||
            profile.cancellationsLast7Days >= 5 ||
            cancellationRatioPercent > 15 ||
            riskScore >= 50;
          
          return {
            userId: profile.userId,
            email: profile.email || 'N/A',
            name: profile.userName || 'N/A',
            riskLevel: riskScore >= 75 ? 'high' :
                      riskScore >= 50 ? 'medium' :
                      riskScore >= 25 ? 'low-medium' : 'low',
            totalCancellations: profile.totalCancellations,
            currentFraudScore: riskScore,
            cancellationsLast24Hours: profile.cancellationsLast24Hours,
            cancellationsLast7Days: profile.cancellationsLast7Days,
            cancellationRatio: profile.cancellationRatio,
            isFlagged: shouldFlag,
            flagReason: shouldFlag ? 
              `Risk Score: ${riskScore}/100 - ${riskFactors[0]}` : 
              null,
            riskFactors,
            totalBookings: profile.totalBookings,
            distinctBoatsBooked: profile.distinctBoatsBooked,
            shortLeadTimeBookings: profile.shortLeadTimeBookings,
            passengerVariance: profile.passengerVariance,
            averageLeadTime: profile.averageLeadTime,
            averageTimeBetweenCancellations: profile.averageTimeBetweenCancellations
          };
        });

        // Update statistics
        setStatistics({
          flaggedUsersCount: transformedUsers.filter(u => u.isFlagged).length,
          highRiskUsersCount: transformedUsers.filter(u => u.riskLevel === 'high').length,
          recentCancellationsCount: transformedUsers.reduce((sum, u) => sum + u.cancellationsLast24Hours, 0),
          suspiciousCancellationsCount: transformedUsers.filter(u => u.cancellationRatio > 0.15).length,
          flaggedUsers: transformedUsers.filter(u => u.isFlagged),
          isRuleBased: true,
          detectionMethod: "rule-based"
        });

        // Update flagged users - only show actually flagged users
        setFlaggedUsers(transformedUsers.filter(u => u.isFlagged));
      } else {
        console.log('No fraud profiles found in response');
        setStatistics({
          flaggedUsersCount: 0,
          highRiskUsersCount: 0,
          recentCancellationsCount: 0,
          suspiciousCancellationsCount: 0,
          flaggedUsers: [],
          isRuleBased: true,
          detectionMethod: "rule-based"
        });
        setFlaggedUsers([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching fraud statistics:', err);
      setError(err.response?.data?.message || 'Failed to fetch fraud statistics');
      setServiceUnavailable(true);
      setLoading(false);
    }
  };

  // Check if Python ML service is available
  const checkPythonServiceStatus = async () => {
    try {
      // Try making a direct request to the ML service status endpoint
      const response = await axios.get('/api/bookings/python-service-status');
      
      if (response.data) {
        setServiceUnavailable(!response.data.available);
        setServiceStatusData({
          available: response.data.available,
          lastChecked: response.data.lastChecked || new Date().toISOString(),
          errorMessage: response.data.errorMessage,
          usingFallback: response.data.usingFallback
        });
      }
    } catch (err) {
      console.error('Error checking ML service status:', err);
      setServiceUnavailable(true);
      setServiceStatusData({
        available: false,
        lastChecked: new Date().toISOString(),
        errorMessage: err.response?.data?.message || 'Failed to check service status',
        usingFallback: true
      });
    }
  };

  const showPythonServiceInfo = () => {
    window.open('/Backend/ml_python_server/README.md', '_blank');
  };

  const handleAnalyzeUser = async (e) => {
    e.preventDefault();
    setError(null);
    setFraudAnalysis(null);
    setHotelComparison(null);
    
    if (!userId && searchType === 'userId') {
      setError('Please enter a user ID');
      return;
    }

    if (!bookingId && searchType === 'bookingId') {
      setError('Please enter a booking ID');
      return;
    }

    try {
      setLoading(true);

      // Analyze with ML model
      const analysisResponse = await axios.post('/api/bookings/analyze-fraud', {
        userId: searchType === 'userId' ? userId : null,
        bookingId: searchType === 'bookingId' ? bookingId : null
      });
      
      setFraudAnalysis(analysisResponse.data.mlAnalysis);
      
      // If userId is provided, also fetch hotel comparison
      if (searchType === 'userId' && userId) {
        const comparisonResponse = await axios.get(`/api/bookings/compare-with-hotel/${userId}`);
        setHotelComparison(comparisonResponse.data);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze user');
      setLoading(false);
    }
  };
  
  // Add a new function to fetch the specific fraud user details
  const fetchFraudUserDetails = async (userId) => {
    try {
      // Try using the users endpoint
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/auth/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        console.log("Successfully fetched user details from auth/users endpoint:", response.data);
        return {
          id: response.data._id || response.data.id,
          userId: response.data._id || response.data.id,
          email: response.data.email,
          name: response.data.name,
          role: response.data.role,
          createdAt: response.data.createdAt,
          licenseNumber: response.data.licenseNumber
        };
      }
      return null;
    } catch (err) {
      console.error(`Error fetching user details from auth/users endpoint for ID ${userId}:`, err);
      
      // Fallback to fraud-users endpoint
      try {
        const fraudUserResponse = await axios.get(`http://localhost:8080/api/fraud-users/fraud-user/${userId}`);
        if (fraudUserResponse.data) {
          console.log("Successfully fetched user details from fraud-users endpoint:", fraudUserResponse.data);
          return fraudUserResponse.data;
        }
      } catch (fraudUserErr) {
        console.error(`Error fetching from fraud-users endpoint for ID ${userId}:`, fraudUserErr);
      }
      
      // Try direct access to user data from flaggedUsers array as fallback
      const flaggedUser = flaggedUsers.find(user => user.userId === userId);
      if (flaggedUser) {
        console.log("Using flagged user data from existing array as immediate fallback");
        return {
          id: userId,
          userId: userId,
          email: flaggedUser.email || 'unknown@example.com',
          name: flaggedUser.name || (flaggedUser.email ? flaggedUser.email.split('@')[0] : 'Flagged User'),
          riskLevel: flaggedUser.riskLevel,
          totalCancellations: flaggedUser.totalCancellations
        };
      }
      
      // Try session API as a last resort
      try {
        const token = localStorage.getItem('token');
        const sessionResponse = await axios.get('http://localhost:8080/api/auth/sessionn', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (sessionResponse.data) {
          console.log("Using session data as fallback:", sessionResponse.data);
          return {
            id: sessionResponse.data.id || sessionResponse.data._id,
            email: sessionResponse.data.email,
            name: sessionResponse.data.name,
            role: sessionResponse.data.role
          };
        }
      } catch (fallbackErr) {
        console.error("All fallback attempts failed:", fallbackErr);
      }
      
      return null;
    }
  };
  
  const handleViewFlaggedUser = async (userId) => {
    setUserId(userId);
    setSearchType('userId');
    
    // Find the user in flaggedUsers array first
    const flaggedUser = flaggedUsers.find(user => user.userId === userId);
    
    try {
      setLoading(true);
      setError(null);
      
      // Clear previous data
      setFraudAnalysis(null);
      setHotelComparison(null);
      
      // Immediately set basic user details from flaggedUsers if available to show something while loading
      if (flaggedUser) {
        const basicUserDetails = {
          id: userId,
          userId: userId,
          email: flaggedUser.email || 'unknown@example.com',
          name: flaggedUser.name || (flaggedUser.email ? flaggedUser.email.split('@')[0] : 'Flagged User'),
          riskLevel: flaggedUser.riskLevel,
          totalCancellations: flaggedUser.totalCancellations,
          // Create a basic fraud profile from the existing data
          fraudProfile: {
            riskLevel: flaggedUser.riskLevel,
            riskScore: flaggedUser.riskScore || (flaggedUser.riskLevel === 'high' ? 80 : 
                                               flaggedUser.riskLevel === 'medium' ? 60 : 30),
            totalCancellations: flaggedUser.totalCancellations || 0,
            isFlagged: true,
            flagReason: "Suspicious booking patterns detected"
          }
        };
        
        setUserDetails(basicUserDetails);
        console.log("Using immediate flagged user data while fetching more details");
      } else {
        // Show loading state
        setUserDetails({
          id: userId,
          userId: userId,
          name: "Loading...",
          email: "Loading...",
          isLoading: true
        });
      }
      
      // Start the parallel data fetching processes
      const fetchProcesses = [
        // 1. Fetch detailed user info from backend
        fetchFraudUserDetails(userId),
        // 2. Get ML analysis
        axios.post('/api/bookings/analyze-fraud', { userId }),
        // 3. Fetch hotel comparison
        axios.get(`/api/bookings/compare-with-hotel/${userId}`),
        // 4. Fetch fraud profile if available
        axios.get(`/api/bookings/fraud-profile/${userId}`).catch(err => {
          console.log("No fraud profile available, using basic data");
          return { data: null };
        })
      ];
      
      // Wait for all requests to complete (even if some fail)
      const [userDetailsResponse, analysisResponse, comparisonResponse, profileResponse] = 
        await Promise.all(fetchProcesses.map(p => p.catch(e => {
          console.error("Error in one of the parallel requests:", e);
          return e;
        })));
      
      // Update user details if we got better data
      if (userDetailsResponse && !(userDetailsResponse instanceof Error)) {
        setUserDetails(prevDetails => ({
          ...userDetailsResponse,
          fraudProfile: prevDetails?.fraudProfile || {}
        }));
        console.log("Updated user details with response from backend");
      }
      
      // Set fraud analysis if available
      if (!(analysisResponse instanceof Error) && analysisResponse.data?.mlAnalysis) {
        setFraudAnalysis(analysisResponse.data.mlAnalysis);
        console.log("Set fraud analysis data");
      }
      
      // Set hotel comparison if available
      if (!(comparisonResponse instanceof Error) && comparisonResponse.data) {
        setHotelComparison(comparisonResponse.data);
        console.log("Set hotel comparison data");
      }
      
      // Merge fraud profile with user details if available
      if (!(profileResponse instanceof Error) && profileResponse.data) {
        setUserDetails(prevDetails => ({
          ...prevDetails,
          fraudProfile: {
            ...prevDetails?.fraudProfile,
            ...profileResponse.data
          }
        }));
        console.log("Merged fraud profile data");
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze flagged user');
      console.error("Error in handleViewFlaggedUser:", err);
      setLoading(false);
    }
  };

  const getRiskBadge = (level) => {
    if (!level) return <Badge bg="secondary">Unknown</Badge>;
    
    switch(level.toLowerCase()) {
      case 'high':
        return <Badge bg="danger">High Risk</Badge>;
      case 'medium':
        return <Badge bg="warning" text="dark">Medium Risk</Badge>;
      case 'low-medium':
        return <Badge bg="info">Low-Medium Risk</Badge>;
      case 'low':
        return <Badge bg="success">Low Risk</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };
  
  const getSimilarityBadge = (score) => {
    if (score === undefined || score === null) return <Badge bg="secondary">Unknown</Badge>;
    
    if (score >= 70) {
      return <Badge bg="success">High Similarity ({score}%)</Badge>;
    } else if (score >= 40) {
      return <Badge bg="warning" text="dark">Moderate Similarity ({score}%)</Badge>;
    } else {
      return <Badge bg="danger">Low Similarity ({score}%)</Badge>;
    }
  };

  // Add this function to reset user details when changing users
  const handleUserIdChange = (e) => {
    setUserId(e.target.value);
    setUserDetails(null); // Clear previous user details
  };

  // Add this code before the return statement in the component
  const displayFlaggedUserDetails = (user) => {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <strong>{user.name || user.email || user.userId}</strong>
            <div className="text-muted small">
              {user.email || 'No email available'}
            </div>
          </div>
          <div className="text-end">
            <Badge bg={
              user.currentFraudScore >= 75 ? 'danger' :
              user.currentFraudScore >= 50 ? 'warning' : 'success'
            } className="me-2">
              Score: {user.currentFraudScore}
            </Badge>
            {user.isFlagged && (
              <Badge bg="danger">Flagged</Badge>
            )}
          </div>
        </div>
        <div className="mt-1 small">
          <span className="me-2">
            <i className="bi bi-calendar-x"></i> {user.cancellationsLast24Hours} (24h)
          </span>
          <span className="me-2">
            <i className="bi bi-calendar-week"></i> {user.cancellationsLast7Days} (7d)
          </span>
          <span>
            <i className="bi bi-percent"></i> {(user.cancellationRatio * 100).toFixed(1)}%
          </span>
        </div>
        {user.flagReason && (
          <div className="mt-1 small text-danger">
            <i className="bi bi-exclamation-triangle"></i> {user.flagReason}
          </div>
        )}
        {user.riskFactors && user.riskFactors.length > 0 && (
          <div className="mt-1 small">
            <strong>Risk Factors:</strong>
            <ul className="mb-0 ps-3">
              {user.riskFactors.map((factor, index) => (
                <li key={index} className="text-danger">{factor}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Add this new function to fetch fraud profiles
  const fetchFraudProfiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/api/book/fraud-profiles');
      console.log('Fetched fraud profiles:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setFraudProfiles(response.data);
      } else {
        console.log('No fraud profiles found in response');
        setFraudProfiles([]);
      }
    } catch (error) {
      console.error('Error fetching fraud profiles:', error);
      if (error.response?.status === 404) {
        // Show a more informative message when no profiles are found
        const message = error.response.data?.details || 
                       error.response.data?.message || 
                       'No fraud profiles found matching criteria';
        console.log(message);
        setFraudProfiles([]);
      } else {
        // Show error message for other types of errors
        const errorMessage = error.response?.data?.details || 
                           error.response?.data?.message || 
                           error.message || 
                           'Failed to fetch fraud profiles';
        console.error(errorMessage);
        setFraudProfiles([]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <h2>Fraud Analysis Panel</h2>
      
      {/* Search Form */}
      {/* <Card className="mb-4">
        <Card.Header>Analyze User or Booking</Card.Header>
        <Card.Body>
          <Form onSubmit={handleAnalyzeUser}>
            <Form.Group className="mb-3">
              <Form.Label>Search Type</Form.Label>
              <Form.Select 
                value={searchType} 
                onChange={(e) => setSearchType(e.target.value)}
              > 
                <option value="userId">User ID</option>
                <option value="bookingId">Booking ID</option> 
              </Form.Select>
            </Form.Group>
            
            {searchType === 'userId' ? (
              <Form.Group className="mb-3">
                <Form.Label>User ID</Form.Label>
                <Form.Control 
                  type="text" 
                  value={userId} 
                  onChange={(e) => setUserId(e.target.value)} 
                  placeholder="Enter user ID"
                />
              </Form.Group>
            ) : (
              <Form.Group className="mb-3">
                <Form.Label>Booking ID</Form.Label>
                <Form.Control 
                  type="text" 
                  value={bookingId} 
                  onChange={(e) => setBookingId(e.target.value)} 
                  placeholder="Enter booking ID"
                />
              </Form.Group>
            )}
            
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : 'Analyze'}
            </Button>
          </Form>
          
          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        </Card.Body>
      </Card> */}
      
      {/* Results Display */}
      <Row>
        {/* ML Analysis Results */}
        {fraudAnalysis && (
          <Col md={6} className="mb-4">
            {/* <Card>
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Fraud Analysis</span>
                  {fraudAnalysis.source === 'rule-based' && (
                    <Badge bg="info" className="ms-2">Rule-Based</Badge>
                  )}
                  {fraudAnalysis.source === 'ml-model' && (
                    <Badge bg="success" className="ms-2">ML Model</Badge>
                  )}
                </div>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Fraud Prediction</h5>
                  <Badge bg={fraudAnalysis.isFraudulent ? "danger" : "success"} className="fs-6">
                    {fraudAnalysis.isFraudulent ? "Potentially Fraudulent" : "Legitimate"}
                  </Badge>
                </div>
                
                <p><strong>Confidence:</strong> {(fraudAnalysis.confidence * 100).toFixed(0)}%</p>
                
                {fraudAnalysis.source === 'rule-based' && (
                  <Alert variant="info" className="mt-2 mb-3">
                    <small>
                      Using rule-based detection. To enable machine learning detection, start the Python ML service.
                      <Button variant="link" className="p-0 ms-1" onClick={showPythonServiceInfo}>
                        Learn more
                      </Button>
                    </small>
                  </Alert>
                )}
                
                {fraudAnalysis.factors && fraudAnalysis.factors.length > 0 && (
                  <>
                    <h6>Risk Signals:</h6>
                    <ul className="text-danger">
                      {fraudAnalysis.factors.map((factor, index) => (
                        <li key={index}>{factor}</li>
                      ))}
                    </ul>
                  </>
                )}
                
                {!fraudAnalysis.factors && fraudAnalysis.signals && fraudAnalysis.signals.length > 0 && (
                  <>
                    <h6>Risk Signals:</h6>
                    <ul className="text-danger">
                      {fraudAnalysis.signals.map((signal, index) => (
                        <li key={index}>{signal.message}</li>
                      ))}
                    </ul>
                  </>
                )}
                
                <p className="text-muted mt-3">
                  <small>Analysis timestamp: {new Date(fraudAnalysis.analysisTimestamp).toLocaleString()}</small>
                </p>
              </Card.Body>
            </Card> */}
          </Col>
        )}
        
        {/* Hotel Comparison Results */}
        {hotelComparison && (
          <Col md={6} className="mb-4">
            {/* <Card>
              <Card.Header>Hotel Cancellation Pattern Comparison</Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Similarity Score</h5>
                  {getSimilarityBadge(hotelComparison.similarityScore)}
                </div>
                
                <p>{hotelComparison.message}</p>
                
                <h6>Recommendation:</h6>
                <p className={hotelComparison.similarityScore < 40 ? "text-danger" : "text-secondary"}>
                  {hotelComparison.recommendation}
                </p>
                
                {hotelComparison.recentCancellations && (
                  <>
                    <h6>Recent Cancellations:</h6>
                    <Table striped bordered hover size="sm">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Lead Time</th>
                          <th>Before Departure</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hotelComparison.recentCancellations.map((c, i) => (
                          <tr key={i}>
                            <td>{new Date(c.cancellationDate).toLocaleDateString()}</td>
                            <td>{c.leadTime} days</td>
                            <td>{c.timeBeforeDeparture} days</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </>
                )}
              </Card.Body>
            </Card> */}
          </Col>
        )}
      </Row>
      
      {/* Fraud Statistics */}
      {statistics && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header>Fraud Detection Statistics</Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3} className="mb-3">
                    <Card bg="light">
                      <Card.Body className="text-center">
                        <h3>{statistics.flaggedUsersCount || 0}</h3>
                        <p>Flagged Users</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3} className="mb-3">
                    <Card bg="light">
                      <Card.Body className="text-center">
                        <h3>{statistics.highRiskUsersCount || 0}</h3>
                        <p>High Risk Users</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3} className="mb-3">
                    <Card bg="light">
                      <Card.Body className="text-center">
                        <h3>{statistics.recentCancellationsCount || 0}</h3>
                        <p>Recent Cancellations</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3} className="mb-3">
                    {/* <Card bg="light">
                      <Card.Body className="text-center">
                        <h3>{statistics.suspiciousCancellationsCount || 0}</h3>
                        <p>Suspicious Cancellations</p>
                      </Card.Body>
                    </Card> */}
                  </Col>
                </Row>
                
                <h6 className="mt-3">Recently Flagged Users</h6>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Risk Score</th>
                      <th>Cancellations</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flaggedUsers.length > 0 ? (
                      flaggedUsers.map((user, index) => (
                        <tr key={index}>
                          <td>{displayFlaggedUserDetails(user)}</td>
                          <td>
                            {getRiskBadge(user.riskLevel)}
                          </td>
                          <td>{user.totalCancellations}</td>
                          <td>
                            <Button 
                              size="sm" 
                              onClick={() => handleViewFlaggedUser(user.userId)}
                              disabled={loading}
                            >
                              Analyze
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">No flagged users</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      
      {/* Fraud Profiles */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>Fraud Profiles</Card.Header>
            <Card.Body>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Email</th>
                    <th>Name</th>
                    {/* <th>Risk Score</th> */}
                    <th>Last 24h Cancellations</th>
                    <th>Last 7d Cancellations</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fraudProfiles.length > 0 ? (
                    fraudProfiles.map((profile) => (
                      <tr key={profile._id}>
                        <td>{profile.userId}</td>
                        <td>{profile.email || 'N/A'}</td>
                        <td>{profile.userName || 'N/A'}</td>
                        {/* <td>
                          <Badge bg={
                            profile.currentFraudScore >= 75 ? 'danger' :
                            profile.currentFraudScore >= 50 ? 'warning' : 'success'
                          }>
                            {profile.currentFraudScore || 0}
                          </Badge>
                        </td> */}
                        <td>
                          <Badge bg={
                            profile.cancellationsLast24Hours > 2 ? 'danger' :
                            profile.cancellationsLast24Hours > 1 ? 'warning' : 'success'
                          }>
                            {profile.cancellationsLast24Hours || 0}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={
                            profile.cancellationsLast7Days > 5 ? 'danger' :
                            profile.cancellationsLast7Days > 3 ? 'warning' : 'success'
                          }>
                            {profile.cancellationsLast7Days || 0}
                          </Badge>
                        </td>
                        <td>
                          <Button 
                            size="sm" 
                            onClick={() => handleViewFlaggedUser(profile.userId)}
                            disabled={loading}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center">No fraud profiles found</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Python Service Info */}
      {serviceUnavailable && (
        <PythonServiceInfo onClick={showPythonServiceInfo} serviceStatusData={serviceStatusData} />
      )}
      
      {/* User Details Card (if available) */}
      {userDetails && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className={userDetails.isLoading ? "bg-secondary text-white" : "bg-info text-white"}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    {userDetails.isLoading ? (
                      <>User Profile <Spinner animation="border" size="sm" className="ms-2" /></>
                    ) : (
                      <>
                        User Profile: {userDetails.name || 'Unknown User'} 
                        {userDetails.fraudProfile?.isFlagged && (
                          <Badge bg="danger" className="ms-2">FLAGGED</Badge>
                        )}
                      </>
                    )}
                  </h5>
                  <div>
                    {userDetails.fraudProfile && !userDetails.isLoading && (
                      <Badge 
                        bg={userDetails.fraudProfile.riskScore > 70 ? 'danger' : 
                           userDetails.fraudProfile.riskScore > 50 ? 'warning' : 'success'}
                        className="fs-6"
                      >
                        {/* Risk Score: {userDetails.fraudProfile.riskScore}/100 */}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                {userDetails.isLoading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" />
                    <p className="mt-3">Loading user details...</p>
                  </div>
                ) : (
                  <>
                    <Row>
                      <Col md={6}>
                        <h5>User Information</h5>
                        <Table striped bordered>
                          <tbody>
                            <tr>
                              <th style={{width: "30%"}}>User ID</th>
                              <td>{userDetails.id}</td>
                            </tr>
                            <tr>
                              <th>Name</th>
                              <td><strong>{userDetails.name || 'Not available'}</strong></td>
                            </tr>
                            <tr>
                              <th>Email</th>
                              <td><strong>{userDetails.email}</strong></td>
                            </tr>
                            {userDetails.licenseNumber && (
                              <tr>
                                <th>License Number</th>
                                <td>{userDetails.licenseNumber}</td>
                              </tr>
                            )}
                            {userDetails.role && (
                              <tr>
                                <th>User Role</th>
                                <td>{userDetails.role}</td>
                              </tr>
                            )}
                            {userDetails.createdAt && (
                              <tr>
                                <th>Account Created</th>
                                <td>{new Date(userDetails.createdAt).toLocaleDateString()}</td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </Col>
                      
                      {userDetails.fraudProfile && (
                        <Col md={6}>
                          <h5>Fraud Risk Profile</h5>
                          <Table striped bordered>
                            <tbody>
                              {/* <tr>
                                <th style={{width: "40%"}}>Risk Level</th>
                                <td>{getRiskBadge(userDetails.fraudProfile.riskLevel)}</td>
                              </tr> */}
                              {/* <tr>
                                <th>Risk Score</th>
                                <td>
                                  <strong className={userDetails.fraudProfile.riskScore > 70 ? 'text-danger' : 
                                                  userDetails.fraudProfile.riskScore > 50 ? 'text-warning' : 'text-success'}>
                                    {userDetails.fraudProfile.riskScore}/100
                                  </strong>
                                </td>
                              </tr> */}
                              <tr>
                                <th>Total Bookings</th>
                                <td>{userDetails.fraudProfile.totalBookings || 'N/A'}</td>
                              </tr>
                              <tr>
                                <th>Total Cancellations</th>
                                <td>
                                  <strong className={userDetails.fraudProfile.totalCancellations > 5 ? 'text-danger' : ''}>
                                    {userDetails.fraudProfile.totalCancellations || 0}
                                  </strong>
                                </td>
                              </tr>
                              {userDetails.fraudProfile.cancellationRatio !== undefined && (
                                <tr>
                                  <th>Cancellation Ratio</th>
                                  <td>
                                    <strong className={userDetails.fraudProfile.cancellationRatio > 0.5 ? 'text-danger' : 
                                                    userDetails.fraudProfile.cancellationRatio > 0.3 ? 'text-warning' : ''}>
                                      {(userDetails.fraudProfile.cancellationRatio * 100).toFixed(1)}%
                                    </strong>
                                  </td>
                                </tr>
                              )}
                              {userDetails.fraudProfile.cancellationsLast24Hours !== undefined && (
                                <tr>
                                  <th>Recent Cancellations</th>
                                  <td>
                                    <strong className={userDetails.fraudProfile.cancellationsLast24Hours > 3 ? 'text-danger' : ''}>
                                      {userDetails.fraudProfile.cancellationsLast24Hours}
                                    </strong> (24h) / 
                                    <strong className={userDetails.fraudProfile.cancellationsLast7Days > 5 ? 'text-danger' : ''}>
                                      {userDetails.fraudProfile.cancellationsLast7Days}
                                    </strong> (7d)
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        </Col>
                      )}
                    </Row>
                    
                    {userDetails.fraudProfile && userDetails.fraudProfile.isFlagged && (
                      <Alert variant="danger" className="mt-3">
                        <Alert.Heading>User Flagged for Suspicious Activity</Alert.Heading>
                        <p><strong>Reason:</strong> {userDetails.fraudProfile.flagReason || "Suspicious booking patterns detected"}</p>
                        {userDetails.fraudProfile.flaggedDate && (
                          <p><small>Flagged on: {new Date(userDetails.fraudProfile.flaggedDate).toLocaleString()}</small></p>
                        )}
                      </Alert>
                    )}
                    
                    {userDetails.fraudProfile && userDetails.fraudProfile.recentCancellations && userDetails.fraudProfile.recentCancellations.length > 0 && (
                      <>
                        <h5 className="mt-4">Recent Cancellations</h5>
                        <Table striped bordered hover responsive>
                          <thead className="bg-light">
                            <tr>
                              <th>Date</th>
                              {/* <th>Lead Time</th> */}
                              <th>Time Before Departure</th>
                              <th>Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userDetails.fraudProfile.recentCancellations.map((cancel, idx) => (
                              <tr key={idx}>
                                <td>{new Date(cancel.cancellationDate).toLocaleDateString()}</td>
                                {/* <td>{cancel.leadTime} days</td> */}
                                <td>{cancel.timeBeforeDeparture} days</td>
                                <td>{cancel.userProvidedReason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Frauddetect; 