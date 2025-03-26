import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Spinner, Alert, Table, Button } from 'react-bootstrap';
import axios from 'axios';
import { Link } from 'react-router-dom';

const FraudSummary = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/bookings/fraud-statistics');
        setStatistics(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching fraud statistics:', err);
        setError('Failed to load fraud statistics');
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <Card className="mb-4">
        <Card.Header>Fraud Detection Summary</Card.Header>
        <Card.Body className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-4 text-danger">
        <Card.Header>Fraud Detection Summary</Card.Header>
        <Card.Body>
          <p>{error}</p>
        </Card.Body>
      </Card>
    );
  }

  const { 
    flaggedUsersCount = 0, 
    highRiskUsersCount = 0, 
    recentCancellationsCount = 0, 
    suspiciousCancellationsCount = 0,
    flaggedUsers = [],
    isRuleBased = false
  } = statistics || {};

  // Helper function to get risk level badge
  const getRiskBadge = (level) => {
    if (!level) return <Badge bg="secondary">Unknown</Badge>;
    
    switch(level.toLowerCase()) {
      case 'high risk':
      case 'very high risk':
      case 'high':
        return <Badge bg="danger">High Risk</Badge>;
      case 'medium risk':
      case 'medium':
        return <Badge bg="warning" text="dark">Medium Risk</Badge>;
      case 'low-medium risk':
      case 'low-medium':
        return <Badge bg="info">Low-Medium Risk</Badge>;
      case 'low risk':
      case 'low':
        return <Badge bg="success">Low Risk</Badge>;
      default:
        return <Badge bg="secondary">{level}</Badge>;
    }
  };

  return (
    <>
      {/* Summary Statistics */}
      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <span className="fw-bold">Fraud Detection Summary</span>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3} className="mb-3">
              <Card bg="light" className="h-100">
                <Card.Body className="text-center">
                  <h3 className="mb-0">{flaggedUsersCount}</h3>
                  <p className="text-muted mb-0">Flagged Users</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card bg="light" className="h-100">
                <Card.Body className="text-center">
                  <h3 className="mb-0">{highRiskUsersCount}</h3>
                  <p className="text-muted mb-0">High Risk Users</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card bg="light" className="h-100">
                <Card.Body className="text-center">
                  <h3 className="mb-0">{recentCancellationsCount}</h3>
                  <p className="text-muted mb-0">Recent Cancellations</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card bg="light" className="h-100">
                <Card.Body className="text-center">
                  <h3 className="mb-0">{suspiciousCancellationsCount}</h3>
                  <p className="text-muted mb-0">Suspicious Cancellations</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {isRuleBased && (
            <div className="mt-3 text-muted small">
              <p>
                <strong>Detection Mode:</strong> Rule-Based
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Flagged Users Table */}
      <Card className="shadow-sm">
        <Card.Header>
          <span className="fw-bold">Recently Flagged Users</span>
        </Card.Header>
        <Card.Body>
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>User</th>
                <th>Risk Level</th>
                <th>Cancellations</th>
                <th>Last Activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flaggedUsers && flaggedUsers.length > 0 ? (
                flaggedUsers.slice(0, 5).map((user, index) => (
                  <tr key={index}>
                    <td>
                      {user.email || user.userId}
                      {user.isNewlyFlagged && (
                        <Badge bg="danger" className="ms-2">New</Badge>
                      )}
                    </td>
                    <td>{getRiskBadge(user.riskLevel)}</td>
                    <td>{user.totalCancellations || 0}</td>
                    <td>
                      {user.lastActivity ? new Date(user.lastActivity).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td>
                      <Button 
                        size="sm" 
                        variant="outline-primary"
                        onClick={() => window.location.href = `/admin/users/${user.userId}`}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">No flagged users found</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </>
  );
};

export default FraudSummary; 