import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

/**
 * Component to display information about the Python ML service status
 * and provide controls to manage it
 */
const PythonServiceInfo = ({ onServiceChange }) => {
  const [serviceStatus, setServiceStatus] = useState({
    status: 'unknown',
    isLoading: true,
    error: null,
    details: null
  });

  // Check service status on component mount and periodically
  useEffect(() => {
    checkServiceStatus();
    const intervalId = setInterval(checkServiceStatus, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  // Function to check the Python service status
  const checkServiceStatus = async () => {
    setServiceStatus(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await axios.get('/api/bookings/python-service-status');
      
      setServiceStatus({
        status: response.data.active ? 'active' : 'inactive',
        isLoading: false,
        error: null,
        details: response.data
      });
      
      // Notify parent component if provided
      if (onServiceChange) {
        onServiceChange(response.data.active);
      }
    } catch (error) {
      console.error('Failed to check Python service status:', error);
      setServiceStatus({
        status: 'error',
        isLoading: false,
        error: error.message || 'Failed to connect to the Python service',
        details: null
      });
      
      // Notify parent component if provided
      if (onServiceChange) {
        onServiceChange(false);
      }
    }
  };

  // Open the Python service manager
  const openServiceManager = () => {
    // Open the service manager in a new tab
    window.open('/ml_python_server/manage.html', '_blank');
  };

  // Get the appropriate badge variant based on service status
  const getBadgeVariant = () => {
    switch (serviceStatus.status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'error':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Get the appropriate text to display based on service status
  const getStatusText = () => {
    switch (serviceStatus.status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <span className="fw-bold">ML Service Status: </span>
          {serviceStatus.isLoading ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <Badge bg={getBadgeVariant()}>{getStatusText()}</Badge>
          )}
        </div>
        <Button 
          variant="outline-primary" 
          size="sm" 
          onClick={checkServiceStatus}
          disabled={serviceStatus.isLoading}
        >
          Refresh
        </Button>
      </Card.Header>
      
      <Card.Body>
        {serviceStatus.error && (
          <Alert variant="danger" className="mb-3">
            {serviceStatus.error}
          </Alert>
        )}
        
        {serviceStatus.details && (
          <div className="small mb-3">
            <div><strong>Version:</strong> {serviceStatus.details.version || 'Unknown'}</div>
            <div><strong>Model:</strong> {serviceStatus.details.modelLoaded ? 'Loaded' : 'Not loaded'}</div>
            <div><strong>Detection:</strong> {serviceStatus.details.ml ? 'Machine Learning' : 'Rule-based'}</div>
            <div><strong>Last checked:</strong> {new Date().toLocaleTimeString()}</div>
          </div>
        )}
        
        {serviceStatus.status === 'inactive' && (
          <Alert variant="warning" className="mb-3">
            The ML service is not running. Use the service manager to start it.
          </Alert>
        )}
        
        <div className="d-grid">
          <Button 
            variant="primary" 
            onClick={openServiceManager}
          >
            Open Service Manager
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PythonServiceInfo; 