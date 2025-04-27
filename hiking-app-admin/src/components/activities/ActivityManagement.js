import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { supabase } from '../../services/supabaseClient';
import { FaTrash, FaEye } from 'react-icons/fa';

const ActivityManagement = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if the table exists first
      const { error: tableError } = await supabase
        .from('hike_records')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.error("Table error:", tableError);
        setError("The hike_records table doesn't exist yet or you don't have access to it.");
        setActivities([]);
        return;
      }
      
      // If table exists, try the full query
      const { data, error } = await supabase
        .from('hike_records')
        .select('*, user_id')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Query error:", error);
        throw error;
      }
      
      // After getting the activities, fetch the user profiles separately
      const activitiesWithProfiles = [];
      
      if (data && data.length > 0) {
        for (const activity of data) {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username, email, avatar_url')
              .eq('id', activity.user_id)
              .single();
            
            activitiesWithProfiles.push({
              ...activity,
              profiles: profileData || null
            });
          } catch (profileError) {
            // Add without profile data
            activitiesWithProfiles.push(activity);
          }
        }
      }
      
      setActivities(activitiesWithProfiles);
    } catch (error) {
      toast.error(`Error fetching hiking activities: ${error.message}`);
      setError(`Error fetching data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewActivity = (activity) => {
    setSelectedActivity(activity);
    setShowViewModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error } = await supabase
        .from('hike_records')
        .delete()
        .eq('id', selectedActivity.id);

      if (error) throw error;
      toast.success('Activity deleted successfully');
      fetchActivities();
      setShowDeleteModal(false);
    } catch (error) {
      toast.error(`Error deleting activity: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "0h 0m";
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const formatPace = (paceValue) => {
    if (!paceValue) return "N/A";
    const minutes = Math.floor(paceValue);
    const seconds = Math.round((paceValue - minutes) * 60);
    return `${minutes}'${seconds.toString().padStart(2, '0')}" /km`;
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Hiking Activities Management</h2>
          <p className="text-muted">Manage and analyze hiking activities recorded by users</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading>Database Setup Required</Alert.Heading>
          <p>{error}</p>
          <hr />
          <p className="mb-0">
            Make sure you've run the SQL script to create the hike_records table in your Supabase database.
            Verify the table name and schema match what's expected by this component.
          </p>
        </Alert>
      )}

      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Date</th>
                  <th>Distance</th>
                  <th>Duration</th>
                  <th>Pace</th>
                  <th>Elevation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activities.map(activity => (
                  <tr key={activity.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded-circle me-2 overflow-hidden" 
                          style={{ width: 32, height: 32, backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url(${activity.profiles?.avatar_url || '/default-avatar.png'})` }}
                        />
                        <div>{activity.profiles?.username || activity.profiles?.email || 'Unknown'}</div>
                      </div>
                    </td>
                    <td>{formatDate(activity.date)}</td>
                    <td>{activity.distance ? `${activity.distance.toFixed(2)} km` : 'N/A'}</td>
                    <td>{formatDuration(activity.duration)}</td>
                    <td>{formatPace(activity.pace)}</td>
                    <td>{activity.elevation ? `${activity.elevation.toFixed(0)} m` : 'N/A'}</td>
                    <td>
                      <Button variant="outline-info" size="sm" className="me-2" onClick={() => handleViewActivity(activity)}>
                        <FaEye /> View
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => {
                        setSelectedActivity(activity);
                        setShowDeleteModal(true);
                      }}>
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}

                {activities.length === 0 && !error && (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      No hiking activities found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* View Activity Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Activity Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedActivity && (
            <div>
              <h5>Basic Information</h5>
              <p><strong>Date:</strong> {formatDate(selectedActivity.date)}</p>
              <p><strong>Distance:</strong> {selectedActivity.distance ? `${selectedActivity.distance.toFixed(2)} km` : 'N/A'}</p>
              <p><strong>Duration:</strong> {formatDuration(selectedActivity.duration)}</p>
              <p><strong>Pace:</strong> {formatPace(selectedActivity.pace)}</p>
              <p><strong>Elevation Gain:</strong> {selectedActivity.elevation ? `${selectedActivity.elevation.toFixed(0)} m` : 'N/A'}</p>
              
              <h5 className="mt-4">User Information</h5>
              <p><strong>Username:</strong> {selectedActivity.profiles?.username || 'Anonymous'}</p>
              <p><strong>Email:</strong> {selectedActivity.profiles?.email || 'Not available'}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this hiking activity record? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ActivityManagement;