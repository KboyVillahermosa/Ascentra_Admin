import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Spinner, Form, InputGroup, Card, Badge, Row, Col } from 'react-bootstrap';
import { FaSearch, FaSync, FaUser, FaUserShield, FaCalendarAlt, FaIdCard, FaCode } from 'react-icons/fa';
import SideNav from '../common/SideNav';
import { supabase, updateDatabaseSchema } from '../../services/supabaseClient';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDatabaseHelper, setShowDatabaseHelper] = useState(false);
  const [updatingSchema, setUpdatingSchema] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null);

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

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSchema = async () => {
    try {
      setUpdatingSchema(true);
      setUpdateStatus(null);
      
      const { success, error } = await updateDatabaseSchema();
      
      if (success) {
        setUpdateStatus({ type: 'success', message: 'Database schema updated successfully!' });
      } else {
        setUpdateStatus({ 
          type: 'error', 
          message: error?.message || 'Failed to update database schema. Please try the manual update.'
        });
      }
    } catch (error) {
      console.error('Error updating schema:', error);
      setUpdateStatus({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setUpdatingSchema(false);
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
      <main className="flex-grow-1">
        <div className="main-header">
          <h1 className="main-title">
            <FaUserShield className="me-2" /> User Management
          </h1>
          <Button variant="success" onClick={fetchUsers}>
            <FaSync className="me-2" /> Refresh
          </Button>
        </div>
        
        <Container fluid>
          <Row className="mb-4">
            <Col lg={8}>
              <Card className="mb-4">
                <Card.Body>
                  <div className="user-search">
                    <FaSearch className="search-icon" />
                    <Form.Control
                      placeholder="Search by username..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="ps-5"
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4}>
              <Card>
                <Card.Body className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">Total Users</h5>
                    <h2 className="mb-0 text-success">{users.length}</h2>
                  </div>
                  <FaUser size={40} className="text-success opacity-50" />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col>
              <Card className="user-table-container">
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" role="status" variant="success" className="mb-3">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <p className="mb-0 text-muted">Loading users...</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover>
                      <thead>
                        <tr>
                          <th width="5%">#</th>
                          <th width="25%">
                            <FaUser className="me-2" />Username
                          </th>
                          <th width="25%">
                            <FaCalendarAlt className="me-2" />Created At
                          </th>
                          <th width="35%">
                            <FaIdCard className="me-2" />User ID
                          </th>
                          <th width="10%">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((user, index) => (
                            <tr key={user.id}>
                              <td>{index + 1}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="user-avatar me-2">
                                    {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                                  </div>
                                  {user.username || 'N/A'}
                                </div>
                              </td>
                              <td>{new Date(user.created_at).toLocaleString()}</td>
                              <td><code>{user.id}</code></td>
                              <td>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => alert(`View details for ${user.username || 'user'}`)}
                                >
                                  Details
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center py-4">
                              {searchTerm ? 'No users match your search' : 'No users found'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
          
          <Button 
            variant="outline-info" 
            className="mt-4"
            onClick={() => setShowDatabaseHelper(!showDatabaseHelper)}
          >
            <FaCode className="me-2" />
            {showDatabaseHelper ? 'Hide DB Helper' : 'Show DB Helper'}
          </Button>

          {showDatabaseHelper && (
            <Card className="mt-3">
              <Card.Header as="h5">Database Schema Helper</Card.Header>
              <Card.Body>
                <p>If you're experiencing errors with missing columns in the forum posts table, you can update your database schema using the button below or run the SQL script manually.</p>
                
                {updateStatus && (
                  <div className={`alert alert-${updateStatus.type === 'success' ? 'success' : 'danger'} mb-3`}>
                    {updateStatus.message}
                  </div>
                )}
                
                <Button
                  variant="primary"
                  className="mb-4"
                  onClick={handleUpdateSchema}
                  disabled={updatingSchema}
                >
                  {updatingSchema ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" />
                      Updating Schema...
                    </>
                  ) : (
                    'Update Database Schema'
                  )}
                </Button>
                
                <h6>SQL Script for Manual Update</h6>
                <pre className="bg-dark text-light p-3 rounded" style={{ whiteSpace: 'pre-wrap' }}>
{`-- Add missing columns to forum_posts table
ALTER TABLE public.forum_posts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE public.forum_posts
ADD COLUMN IF NOT EXISTS reported_count INTEGER DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS forum_posts_status_idx ON public.forum_posts(status);

-- Update existing posts to have the 'active' status
UPDATE public.forum_posts SET status = 'active' WHERE status IS NULL;
UPDATE public.forum_posts SET reported_count = 0 WHERE reported_count IS NULL;`}
                </pre>
              </Card.Body>
            </Card>
          )}
        </Container>
      </main>
    </div>
  );
};

export default UserManagement;