import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { supabase } from '../../services/supabaseClient';
import { FaTrash, FaEdit, FaPlus } from 'react-icons/fa';

const TrailManagement = () => {
  const [trails, setTrails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentTrail, setCurrentTrail] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    region: '',
    image_url: '',
    difficulty: 'Moderate'
  });

  useEffect(() => {
    fetchTrails();
  }, []);

  const fetchTrails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hiking_spots')
        .select('*')
        .order('name');

      if (error) throw error;
      setTrails(data || []);
    } catch (error) {
      toast.error(`Error fetching trails: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setCurrentTrail(null);
    setFormData({
      name: '',
      description: '',
      location: '',
      region: '',
      image_url: '',
      difficulty: 'Moderate'
    });
    setShowFormModal(true);
  };

  const handleEdit = (trail) => {
    setCurrentTrail(trail);
    setFormData({
      name: trail.name || '',
      description: trail.description || '',
      location: trail.location || '',
      region: trail.region || '',
      image_url: trail.image_url || '',
      difficulty: trail.difficulty || 'Moderate'
    });
    setShowFormModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let error;
      
      if (currentTrail) {
        const { error: updateError } = await supabase
          .from('hiking_spots')
          .update(formData)
          .eq('id', currentTrail.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('hiking_spots')
          .insert([formData]);
        error = insertError;
      }

      if (error) throw error;

      toast.success(`Trail ${currentTrail ? 'updated' : 'added'} successfully`);
      setShowFormModal(false);
      fetchTrails();
    } catch (error) {
      toast.error(`Error ${currentTrail ? 'updating' : 'adding'} trail: ${error.message}`);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error } = await supabase
        .from('hiking_spots')
        .delete()
        .eq('id', currentTrail.id);

      if (error) throw error;
      toast.success('Trail deleted successfully');
      fetchTrails();
      setShowDeleteModal(false);
    } catch (error) {
      toast.error(`Error deleting trail: ${error.message}`);
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Trail Management</h2>
          <p className="text-muted">Manage hiking trails, peaks, and spots</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={handleAddNew}>
            <FaPlus className="me-2" /> Add New Trail
          </Button>
        </Col>
      </Row>

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
                  <th>Name</th>
                  <th>Location</th>
                  <th>Region</th>
                  <th>Difficulty</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trails.map(trail => (
                  <tr key={trail.id}>
                    <td>{trail.name}</td>
                    <td>{trail.location}</td>
                    <td>{trail.region}</td>
                    <td>{trail.difficulty || 'Not specified'}</td>
                    <td>
                      {trail.average_rating ? (
                        <div className="d-flex align-items-center">
                          <span className="me-2">{Number(trail.average_rating).toFixed(1)}</span>
                          <span className="text-warning">★</span>
                          <small className="ms-1 text-muted">({trail.rating_count || 0})</small>
                        </div>
                      ) : 'No ratings'}
                    </td>
                    <td>
                      <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(trail)}>
                        <FaEdit /> Edit
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => {
                        setCurrentTrail(trail);
                        setShowDeleteModal(true);
                      }}>
                        <FaTrash /> Delete
                      </Button>
                    </td>
                  </tr>
                ))}

                {trails.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      No trails found. Add your first trail.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Trail Form Modal */}
      <Modal show={showFormModal} onHide={() => setShowFormModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{currentTrail ? 'Edit Trail' : 'Add New Trail'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Trail Name</Form.Label>
              <Form.Control 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control 
                type="text" 
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Region</Form.Label>
              <Form.Control 
                type="text" 
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Difficulty</Form.Label>
              <Form.Select 
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
              >
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Difficult">Difficult</option>
                <option value="Very Difficult">Very Difficult</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control 
                type="text" 
                name="image_url"
                value={formData.image_url}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />
            </Form.Group>
          </Modal.Body>
          
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowFormModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Trail
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the trail "{currentTrail?.name}"? This action cannot be undone.
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

export default TrailManagement;