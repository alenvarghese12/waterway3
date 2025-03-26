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

const FraudAnalysisPanel = () => {
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

  // Fetch flagged users on component mount
  useEffect(() => {
    fetchFraudStatistics();
    checkPythonServiceStatus();
  }, []);

  const fetchFraudStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/booking/flagged-users');
      
      if (response.data) {
        setStatistics(response.data);
        setFlaggedUsers(response.data.flaggedUsers || []);
        
        // Check if using rule-based detection due to service unavailability
        if (response.data.isRuleBased) {
          setServiceUnavailable(true);
          console.log('Using rule-based detection: ML service might be unavailable');
        } else {
          setServiceUnavailable(false);
        }
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
  
  const handleViewFlaggedUser = async (userId) => {
    setUserId(userId);
    setSearchType('userId');
    
    try {
      setLoading(true);
      
      // Analyze with ML model
      const analysisResponse = await axios.post('/api/bookings/analyze-fraud', { userId });
      setFraudAnalysis(analysisResponse.data.mlAnalysis);
      
      // Fetch hotel comparison
      const comparisonResponse = await axios.get(`/api/bookings/compare-with-hotel/${userId}`);
      setHotelComparison(comparisonResponse.data);
      
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze flagged user');
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

  return (
    <Container className="mt-4">
      <h2>Fraud Analysis Panel</h2>
      
      {/* Search Form */}
      <Card className="mb-4">
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
      </Card>
      
      {/* Results Display */}
      <Row>
        {/* ML Analysis Results */}
        {fraudAnalysis && (
          <Col md={6} className="mb-4">
            <Card>
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
            </Card>
          </Col>
        )}
        
        {/* Hotel Comparison Results */}
        {hotelComparison && (
          <Col md={6} className="mb-4">
            <Card>
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
            </Card>
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
                    <Card bg="light">
                      <Card.Body className="text-center">
                        <h3>{statistics.suspiciousCancellationsCount || 0}</h3>
                        <p>Suspicious Cancellations</p>
                      </Card.Body>
                    </Card>
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
                          <td>{user.email || user.userId}</td>
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
      
      {/* Python Service Info */}
      {serviceUnavailable && (
        <PythonServiceInfo onClick={showPythonServiceInfo} serviceStatusData={serviceStatusData} />
      )}
    </Container>
  );
};

export default FraudAnalysisPanel; 