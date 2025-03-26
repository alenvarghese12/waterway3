import React from 'react';
import { Container, Card, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import FraudSummary from '../../Components/Admin/FraudSummary';

const AdminPanel = () => {
  return (
    <Container className="py-4">
      <h1 className="mb-4">Admin Dashboard</h1>
      
      {/* Fraud Summary */}
      <FraudSummary />
      
      {/* Admin Actions */}
      <Row>
        <Col md={4} className="mb-4">
          <Card>
            <Card.Header>Fraud Detection</Card.Header>
            <Card.Body>
              <p>
                Monitor and analyze booking cancellation patterns for fraud detection.
              </p>
              <div className="d-grid gap-2">
                <Button as={Link} to="/admin/fraud-analysis" variant="warning">
                  View Fraud Analysis
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card>
            <Card.Header>Boat Management</Card.Header>
            <Card.Body>
              <p>
                Manage boat listings, approve new boats, and review boat details.
              </p>
              <div className="d-grid gap-2">
                <Button as={Link} to="/admin/boats" variant="primary">
                  Manage Boats
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card>
            <Card.Header>User Management</Card.Header>
            <Card.Body>
              <p>
                Manage user accounts, review user profiles, and monitor user activity.
              </p>
              <div className="d-grid gap-2">
                <Button as={Link} to="/admin/users" variant="success">
                  Manage Users
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminPanel; 