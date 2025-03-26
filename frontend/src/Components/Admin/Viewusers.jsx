import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

// Styled-components
const Container = styled.div`
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-width: 1000px;
  margin: 0 auto;
  margin-top: 20px;
`;

const Title = styled.h2`
  margin-bottom: 20px;
  font-size: 28px;
  color: #333;
  text-align: center;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
`;

const TableHeader = styled.th`
  padding: 12px 20px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  background-color: #f2f2f2;
`;

const TableData = styled.td`
  padding: 12px 20px;
  text-align: left;
  border-bottom: 1px solid #ddd;
`;

const Button = styled.button`
  padding: 8px 12px;
  margin: 0 5px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  background-color: ${props => props.delete ? '#ff4d4d' : '#007bff'};
  color: white;

  &:hover {
    background-color: ${props => props.delete ? '#ff3333' : '#0056b3'};
  }
`;

const Viewusers = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();  // Initialize navigate

  // useEffect(() => {
  //   const fetchUsers = async () => {
  //     try {
  //       const response = await axios.get('http://localhost:8080/api/auth/users');
  //       // Filter out admin users
  //       const nonAdminUsers = response.data.filter(user => user.role !== 'admin');
  //       setUsers(nonAdminUsers);
  //     } catch (error) {
  //       console.error('Failed to fetch users', error);
  //     }
  //   };

  //   fetchUsers();
  // }, []);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/auth/users');
        // Filter out inactive users
        const activeUsers = response.data.filter(user => user.status === 'Active');
        setUsers(activeUsers);
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    };
  
    fetchUsers();
  }, []);
  

  // const handleDelete = async (userId) => {
  //   try {
  //     await axios.delete(`http://localhost:8080/api/auth/users/${userId}`);
  //     // After deletion, update the users list
  //     setUsers(users.filter(user => user._id !== userId));
  //   } catch (error) {
  //     console.error('Failed to delete user', error);
  //   }
  // };

  const handleDelete = async (userId) => {
    try {
      // Mark the user as inactive in the backend
      await axios.delete(`http://localhost:8080/api/auth/users/${userId}`);
  
      // Update the users list in the state to hide the inactive user
      setUsers(users.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Failed to deactivate user', error);
    }
  };
  
  

  // Navigate to the edit page when the Edit button is clicked
  const handleEditClick = (userId) => {
    navigate(`/admin/edituser/${userId}`);  // Use the correct path format
  };
  return (
    <Container>
      <Title>View Users</Title>
      <Table>
        <thead>
          <tr>
            <TableHeader>Name</TableHeader>
            <TableHeader>Email</TableHeader>
            <TableHeader>Role</TableHeader>
            {/* <TableHeader>Status</TableHeader> */}
            <TableHeader>Actions</TableHeader>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <TableData>{user.name}</TableData>
              <TableData>{user.email}</TableData>
              <TableData>{user.role}</TableData>
              {/* <TableData>{user.status}</TableData> */}
              <TableData>
                {/* <Button onClick={() => handleEditClick(user._id)}>Edit</Button> */}
                <Button delete onClick={() => handleDelete(user._id)}>Delete</Button>
              </TableData>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default Viewusers;

