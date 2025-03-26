import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Button, Row, Col, Badge, Spinner, Alert, Table, Modal, ListGroup, Tabs, Tab } from 'react-bootstrap';
import { format } from 'date-fns';

// Add at the top of your file, below imports
const MOCK_ALERTS = [
  {
    id: "mock1",
    detectedAt: new Date(),
    boatName: "Luxury Yacht",
    userEmail: "user@example.com",
    riskLevel: "Medium Risk",
    primaryReason: "Multiple bookings in short time period",
    reviewed: false
  },
  {
    id: "mock2",
    detectedAt: new Date(Date.now() - 86400000), // 1 day ago
    boatName: "Speed Boat",
    userEmail: "another@example.com",
    riskLevel: "High Risk",
    primaryReason: "Short lead time with history of cancellations",
    reviewed: true,
    reviewedAt: new Date(Date.now() - 43200000) // 12 hours ago
  }
];

const MOCK_STATISTICS = {
  highRiskCount: 2,
  mediumRiskCount: 3,
  totalAlertCount: 7,
  totalReviewedCount: 4
};

// Component to display risk level with appropriate coloring
const RiskBadge = ({ level }) => {
  let bg = 'secondary';
  
  if (!level) {
    return <Badge bg="secondary">Unknown</Badge>;
  }
  
  if (level.includes('Low')) {
    bg = 'success';
  } else if (level.includes('Medium')) {
    bg = 'warning';
  } else if (level.includes('High')) {
    bg = 'danger';
  } else if (level.includes('Very High')) {
    bg = 'danger';
  }
  
  return <Badge bg={bg}>{level}</Badge>;
};

const FraudAlerts = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [multipleBookingsAlerts, setMultipleBookingsAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [fraudUsers, setFraudUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('alerts');

  useEffect(() => {
    fetchAlerts();
    fetchFraudUsers();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get('/api/boatowner/fraud-alerts');
        
        setAlerts(response.data.alerts || []);
        setStatistics(response.data.statistics || {});
        setMultipleBookingsAlerts(response.data.multipleBookingsAlerts || []);
      } catch (err) {
        console.error('Error fetching fraud alerts:', err);
        
        // Use mock data if API fails
        setAlerts(MOCK_ALERTS);
        setStatistics(MOCK_STATISTICS);
        setMultipleBookingsAlerts([]);
        
        // Show a more friendly error message
        setError('Using demo data: The fraud alerts API is currently unavailable. Please check your backend server.');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error in fetchAlerts:', err);
      setError('An unexpected error occurred. Please try again later.');
      setLoading(false);
    }
  };

  const fetchFraudUsers = async () => {
    try {
      // Try the plural endpoint first
      let response;
      try {
        response = await axios.get('/api/bookings/fraud-statistics');
      } catch (err) {
        // If plural endpoint fails, try singular as fallback
        if (err.response && err.response.status === 404) {
          response = await axios.get('/api/booking/fraud-statistics');
        } else {
          throw err;
        }
      }
      
      if (response.data && response.data.flaggedUsers) {
        setFraudUsers(response.data.flaggedUsers);
      }
    } catch (err) {
      console.error('Error fetching fraud users:', err);
      // We don't set the error state here since this is a supplementary feature
      // and we don't want to block the main alerts functionality
    }
  };

  const viewAlertDetails = async (alertId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/boatowner/fraud-alerts/${alertId}`);
      setSelectedAlert(response.data);
      setShowDetailsModal(true);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching alert details:', err);
      setError('Failed to fetch alert details. Please try again later.');
      setLoading(false);
    }
  };

  const markAsReviewed = async (alertId) => {
    try {
      setLoading(true);
      await axios.post(`/api/boatowner/fraud-alerts/${alertId}/mark-reviewed`);
      
      // Update local state
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, reviewed: true, reviewedAt: new Date() } : alert
      ));
      
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert({ ...selectedAlert, reviewed: true, reviewedAt: new Date() });
      }
      
      // Update statistics
      setStatistics({
        ...statistics,
        totalReviewedCount: statistics.totalReviewedCount + 1
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error marking alert as reviewed:', err);
      setError('Failed to mark alert as reviewed. Please try again later.');
      setLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedAlert(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  // Handle user fraud analysis
  const analyzeUser = async (userId) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/bookings/analyze-fraud', { userId });
      
      if (response.data.mlAnalysis) {
        // Add to selected alert to show in modal
        setSelectedAlert({
          userFraudAnalysis: response.data.mlAnalysis,
          userId,
          detectedAt: new Date(),
        });
        setShowDetailsModal(true);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error analyzing user:', err);
      setError('Failed to analyze user. Please try again later.');
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <h2>Fraud Detection & Alerts</h2>
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="alerts" title="Fraud Alerts">
          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <h2>{statistics.totalAlertCount || 0}</h2>
                  <p>Total Alerts</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100 bg-danger text-white">
                <Card.Body>
                  <h2>{statistics.highRiskCount || 0}</h2>
                  <p>High Risk Alerts</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100 bg-warning">
                <Card.Body>
                  <h2>{statistics.mediumRiskCount || 0}</h2>
                  <p>Medium Risk Alerts</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <h2>{statistics.totalAlertCount - statistics.totalReviewedCount || 0}</h2>
                  <p>Pending Review</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Multiple Bookings Warning */}
          {multipleBookingsAlerts.length > 0 && (
            <Alert variant="warning" className="mb-4">
              <Alert.Heading>Multiple Bookings Detected!</Alert.Heading>
              <p>
                We've detected {multipleBookingsAlerts.length} users making multiple bookings in a short timeframe.
                This could indicate potential fraud or booking manipulation.
              </p>
              <hr />
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>User Email</th>
                    <th>Bookings</th>
                    <th>Time Span</th>
                    <th>Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {multipleBookingsAlerts.map((alert, index) => (
                    <tr key={index}>
                      <td>{alert.userEmail}</td>
                      <td>{alert.bookingCount}</td>
                      <td>{alert.timeSpan}</td>
                      <td><RiskBadge level={alert.riskLevel} /></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Alert>
          )}
          
          {/* Main Alerts Table */}
          <Card>
            <Card.Header>Recent Fraud Alerts</Card.Header>
            <Card.Body>
              {loading && <div className="text-center py-4"><Spinner animation="border" /></div>}
              {error && <Alert variant="danger">{error}</Alert>}
              
              {!loading && alerts.length === 0 && (
                <Alert variant="info">No fraud alerts detected at this time.</Alert>
              )}
              
              {!loading && alerts.length > 0 && (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Date Detected</th>
                      <th>Boat</th>
                      <th>User</th>
                      <th>Risk Level</th>
                      <th>Primary Reason</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map(alert => (
                      <tr key={alert.id} className={!alert.reviewed ? 'table-warning' : ''}>
                        <td>{formatDate(alert.detectedAt)}</td>
                        <td>{alert.boatName}</td>
                        <td>{alert.userEmail}</td>
                        <td><RiskBadge level={alert.riskLevel} /></td>
                        <td>{alert.primaryReason}</td>
                        <td>
                          {alert.reviewed ? (
                            <Badge bg="success">Reviewed</Badge>
                          ) : (
                            <Badge bg="warning" text="dark">Pending Review</Badge>
                          )}
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-1"
                            onClick={() => viewAlertDetails(alert.id)}
                          >
                            View
                          </Button>
                          {!alert.reviewed && (
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              onClick={() => markAsReviewed(alert.id)}
                            >
                              Mark Reviewed
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="users" title="Flagged Users">
          <Card>
            <Card.Header>Flagged Users</Card.Header>
            <Card.Body>
              {loading && <div className="text-center py-4"><Spinner animation="border" /></div>}
              {!loading && fraudUsers.length === 0 && (
                <Alert variant="info">No flagged users detected at this time.</Alert>
              )}
              
              {!loading && fraudUsers.length > 0 && (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Risk Level</th>
                      <th>Cancellations</th>
                      <th>Fraud Score</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fraudUsers.map((user, index) => (
                      <tr key={index}>
                        <td>{user.email}</td>
                        <td><RiskBadge level={user.riskLevel} /></td>
                        <td>{user.totalCancellations}</td>
                        <td>{user.fraudScore}</td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => analyzeUser(user.userId)}
                          >
                            Analyze
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
      
      {/* Alert Details Modal */}
      <Modal show={showDetailsModal} onHide={closeDetailsModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedAlert?.userFraudAnalysis ? (
              <>User Fraud Analysis</>
            ) : (
              <>Fraud Alert Details</>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAlert?.userFraudAnalysis ? (
            <div>
              <Alert variant={selectedAlert.userFraudAnalysis.isFraud ? "danger" : "success"}>
                <Alert.Heading>
                  {selectedAlert.userFraudAnalysis.isFraud ? (
                    <>Potentially Fraudulent User</>
                  ) : (
                    <>Likely Legitimate User</>
                  )}
                </Alert.Heading>
                <p>Confidence: {(selectedAlert.userFraudAnalysis.confidence * 100).toFixed(0)}%</p>
              </Alert>
              
              {selectedAlert.userFraudAnalysis.factors && selectedAlert.userFraudAnalysis.factors.length > 0 && (
                <>
                  <h6>Risk Signals:</h6>
                  <ListGroup className="mb-3">
                    {selectedAlert.userFraudAnalysis.factors.map((factor, index) => (
                      <ListGroup.Item 
                        key={index}
                        variant="danger"
                      >
                        {factor}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </>
              )}
              
              <small className="text-muted">
                Analysis performed at {formatDate(selectedAlert.detectedAt)}
              </small>
            </div>
          ) : selectedAlert ? (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <p><strong>Detected:</strong> {formatDate(selectedAlert.detectedAt)}</p>
                  <p><strong>Boat:</strong> {selectedAlert.boatName}</p>
                  <p><strong>Risk Level:</strong> <RiskBadge level={selectedAlert.riskLevel} /></p>
                  <p>
                    <strong>Status:</strong> {selectedAlert.reviewed ? (
                      <Badge bg="success">Reviewed on {formatDate(selectedAlert.reviewedAt)}</Badge>
                    ) : (
                      <Badge bg="warning" text="dark">Pending Review</Badge>
                    )}
                  </p>
                </Col>
                <Col md={6}>
                  <p><strong>User Email:</strong> {selectedAlert.userEmail}</p>
                  <p><strong>User Account Age:</strong> {selectedAlert.userAccountAge}</p>
                  <p><strong>Total Bookings:</strong> {selectedAlert.userTotalBookings}</p>
                  <p><strong>Cancellation Ratio:</strong> {(selectedAlert.userCancellationRatio * 100).toFixed(1)}%</p>
                </Col>
              </Row>
              
              <h6>Risk Factors:</h6>
              <ListGroup className="mb-3">
                {selectedAlert.riskFactors && selectedAlert.riskFactors.map((factor, index) => (
                  <ListGroup.Item 
                    key={index}
                    variant={selectedAlert.riskLevel.includes('High') ? "danger" : "warning"}
                  >
                    {factor}
                  </ListGroup.Item>
                ))}
              </ListGroup>
              
              <h6>Recommendation:</h6>
              <Alert variant="info">
                {selectedAlert.recommendation || "Monitor this user for further suspicious activity."}
              </Alert>
              
              {selectedAlert.relatedBookings && selectedAlert.relatedBookings.length > 0 && (
                <>
                  <h6>Related Bookings:</h6>
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Boat</th>
                        <th>Booking Date</th>
                        <th>Departure</th>
                        <th>Status</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAlert.relatedBookings.map((booking, index) => (
                        <tr key={index}>
                          <td>{booking.boatName}</td>
                          <td>{formatDate(booking.bookingDate)}</td>
                          <td>{formatDate(booking.departureDate)}</td>
                          <td>{booking.status}</td>
                          <td>${booking.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
            </div>
          ) : (
            <Spinner animation="border" />
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedAlert && !selectedAlert.userFraudAnalysis && !selectedAlert.reviewed && (
            <Button 
              variant="success" 
              onClick={() => {
                markAsReviewed(selectedAlert.id);
                closeDetailsModal();
              }}
            >
              Mark as Reviewed
            </Button>
          )}
          <Button variant="secondary" onClick={closeDetailsModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default FraudAlerts; 