import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { supabase } from '../../services/supabaseClient';
import { FaTrash, FaEye } from 'react-icons/fa';

const SocialMediaManagement = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      toast.error(`Error fetching posts: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPost = async (post) => {
    setSelectedPost(post);
    setShowViewModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', selectedPost.id);

      if (error) throw error;
      toast.success('Post deleted successfully');
      fetchPosts();
      setShowDeleteModal(false);
    } catch (error) {
      toast.error(`Error deleting post: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Social Media Posts Management</h2>
          <p className="text-muted">Manage user posts from the Ascentra social feature</p>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Content</th>
                  <th>Posted On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded-circle me-2 overflow-hidden" 
                          style={{ width: 40, height: 40, backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url(${post.profiles?.avatar_url || '/default-avatar.png'})` }}
                        />
                        <div>{post.profiles?.username || 'Unknown'}</div>
                      </div>
                    </td>
                    <td>
                      <div className="text-truncate" style={{ maxWidth: 300 }}>
                        {post.content || '[Media post without text]'}
                      </div>
                    </td>
                    <td>{formatDate(post.created_at)}</td>
                    <td>
                      <Button variant="outline-info" size="sm" className="me-2" onClick={() => handleViewPost(post)}>
                        <FaEye /> View
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => {
                        setSelectedPost(post);
                        setShowDeleteModal(true);
                      }}>
                        <FaTrash /> Delete
                      </Button>
                    </td>
                  </tr>
                ))}

                {posts.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      No posts found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* View Post Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Post Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPost && (
            <>
              <div className="d-flex align-items-center mb-3">
                <div 
                  className="rounded-circle me-2 overflow-hidden" 
                  style={{ width: 50, height: 50, backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url(${selectedPost.profiles?.avatar_url || '/default-avatar.png'})` }}
                />
                <div>
                  <h5 className="mb-0">{selectedPost.profiles?.username || 'Unknown'}</h5>
                  <small className="text-muted">{formatDate(selectedPost.created_at)}</small>
                </div>
              </div>
              
              <div className="mb-4">
                <p>{selectedPost.content}</p>
                {selectedPost.media && selectedPost.media.length > 0 && (
                  <div className="mt-2">
                    {selectedPost.media.map((mediaUrl, index) => (
                      <img 
                        key={index}
                        src={mediaUrl} 
                        alt={`Post media ${index + 1}`}
                        className="img-fluid rounded mb-2"
                        style={{ maxHeight: 300 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
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
          Are you sure you want to delete this post? This action cannot be undone.
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

export default SocialMediaManagement;