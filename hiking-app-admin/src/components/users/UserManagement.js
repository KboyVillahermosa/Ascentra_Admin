import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Spinner, Form, InputGroup } from 'react-bootstrap';
import SideNav from '../common/SideNav';
import { supabase } from '../../services/supabaseClient';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch users from the profiles table which contains all registered users
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('Users retrieved:', data);
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const username = user.username?.toLowerCase() || '';
    
    return username.includes(searchLower);
  });

  return (
    <div className="d-flex">
      <SideNav />
      <main className="flex-grow-1 p-4">
        <Container fluid>
          <h1 className="mb-4">User Management</h1>
          
          <InputGroup className="mb-4" style={{ maxWidth: '500px' }}>
            <Form.Control
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
              Clear
            </Button>
          </InputGroup>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-3">Loading users...</p>
            </div>
          ) : (
            <>
              <p>Total Users: {users.length}</p>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Username</th>
                    <th>Created At</th>
                    <th>User ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                      <tr key={user.id}>
                        <td>{index + 1}</td>
                        <td>{user.username || 'N/A'}</td>
                        <td>{new Date(user.created_at).toLocaleString()}</td>
                        <td>{user.id}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center">
                        {searchTerm ? 'No users match your search' : 'No users found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </>
          )}
        </Container>
      </main>
    </div>
  );
};

export default UserManagement;