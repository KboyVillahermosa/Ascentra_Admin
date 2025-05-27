import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Modal, Pagination, Image, Spinner, Alert } from 'react-bootstrap';
import { supabase } from '../services/supabaseClient';
import { 
  FaHeart, FaComment, FaTrash, FaBan, FaFlag, 
  FaSearch, FaEye, FaEyeSlash, FaEdit, FaCheck, FaPlay,
  FaComments, FaFilter, FaSync
} from 'react-icons/fa';
import SideNav from '../components/common/SideNav';

const ForumAdmin = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentsVisible, setCommentsVisible] = useState({});
  const [postComments, setPostComments] = useState({});
  const [confirmModal, setConfirmModal] = useState(false);
  const [modalAction, setModalAction] = useState({ type: '', id: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [viewMediaModal, setViewMediaModal] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(null);
  
  const postsPerPage = 10;
  const videoRef = useRef(null);

  // Fetch posts on component mount and when filter/page changes
  useEffect(() => {
    fetchPosts();
  }, [filterStatus, currentPage]);

  // Fetch forum posts from Supabase
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate pagination range
      const from = (currentPage - 1) * postsPerPage;
      const to = from + postsPerPage - 1;
      
      // Build basic query
      let query = supabase
        .from('forum_posts')
        .select(`
          id,
          content,
          created_at,
          user_id
        `, { count: 'exact' });
      
      // Apply search if provided
      if (searchTerm) {
        query = query.ilike('content', `%${searchTerm}%`);
      }
      
      // Apply pagination and ordering
      const { data: postsData, error: postsError, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (postsError) throw postsError;
      
      // Calculate total pages
      setTotalPages(Math.ceil(count / postsPerPage));
      
      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }
      
      // Get all post media
      const { data: mediaData, error: mediaError } = await supabase
        .from('forum_post_media')
        .select('*')
        .in('post_id', postsData.map(post => post.id));
        
      if (mediaError) {
        console.error('Error fetching post media:', mediaError);
      }
      
      // Group media by post_id
      const mediaByPost = {};
      if (mediaData) {
        mediaData.forEach(media => {
          if (!mediaByPost[media.post_id]) {
            mediaByPost[media.post_id] = [];
          }
          mediaByPost[media.post_id].push(media);
        });
      }
      
      // Extract all unique user IDs from posts
      const userIds = [...new Set(postsData.map(post => post.user_id))];
      
      // Get all profiles for these users in a single query
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }
      
      // Create a map of user IDs to profiles for quick lookup
      const profilesMap = {};
      if (profilesData) {
        profilesData.forEach(profile => {
          profilesMap[profile.id] = profile;
        });
      }
      
      // Fetch like counts for all posts
      const { data: likeData, error: likeError } = await supabase
        .from('forum_likes')
        .select('post_id, id')
        .in('post_id', postsData.map(post => post.id));
        
      if (likeError) {
        console.error('Error fetching likes:', likeError);
      }
      
      // Count likes by post
      const likesByPost = {};
      if (likeData) {
        likeData.forEach(like => {
          if (!likesByPost[like.post_id]) {
            likesByPost[like.post_id] = 0;
          }
          likesByPost[like.post_id]++;
        });
      }
      
      // Fetch comment counts for all posts
      const { data: commentCountData, error: commentCountError } = await supabase
        .from('forum_comments')
        .select('post_id, id')
        .in('post_id', postsData.map(post => post.id));
        
      if (commentCountError) {
        console.error('Error fetching comment counts:', commentCountError);
      }
      
      // Count comments by post
      const commentsByPost = {};
      if (commentCountData) {
        commentCountData.forEach(comment => {
          if (!commentsByPost[comment.post_id]) {
            commentsByPost[comment.post_id] = 0;
          }
          commentsByPost[comment.post_id]++;
        });
      }
      
      // Attach profile data, media, and counts to each post
      const postsWithData = postsData.map(post => ({
        ...post,
        profile: profilesMap[post.user_id] || null,
        media: mediaByPost[post.id] || [],
        likeCount: likesByPost[post.id] || 0,
        commentCount: commentsByPost[post.id] || 0,
        // Add default values for missing columns
        status: post.status || 'active',
        reported_count: post.reported_count || 0
      }));
      
      setPosts(postsWithData);
    } catch (error) {
      console.error('Error fetching forum posts:', error);
      
      // Check if the error is due to missing columns and notify the user
      if (error.message && error.message.includes('column forum_posts.status does not exist')) {
        setError('Database schema is missing required columns. Please update your database schema using the helper in User Management.');
      } else {
        setError('Failed to load forum posts. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchPosts();
  };

  // Clear search filters
  const clearSearch = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setCurrentPage(1);
  };

  // Fetch comments for a post
  const fetchComments = async (postId) => {
    // Toggle comments visibility
    setCommentsVisible(prev => {
      const newState = { ...prev };
      newState[postId] = !newState[postId];
      return newState;
    });
    
    // If we're closing the comments section, just return
    if (commentsVisible[postId]) {
      return;
    }
    
    // If we don't have the comments data yet, fetch it
    if (!postComments[postId]) {
      try {
        const { data, error } = await supabase
          .from('forum_comments')
          .select(`
            id,
            content,
            created_at,
            user_id,
            status
          `)
          .eq('post_id', postId)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        // Get all unique commenter user IDs
        const commenterIds = [...new Set(data.map(comment => comment.user_id))];
        
        // Get profile data for commenters
        const { data: commenterProfiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', commenterIds);
          
        if (profileError) {
          console.error('Error fetching commenter profiles:', profileError);
        }
        
        // Create a map of user IDs to profiles
        const profileMap = {};
        if (commenterProfiles) {
          commenterProfiles.forEach(profile => {
            profileMap[profile.id] = profile;
          });
        }
        
        // Attach profile data to comments
        const commentsWithProfiles = data.map(comment => ({
          ...comment,
          profile: profileMap[comment.user_id] || null
        }));
        
        // Update comments state
        setPostComments(prev => ({
          ...prev,
          [postId]: commentsWithProfiles
        }));
      } catch (error) {
        console.error('Error fetching comments:', error);
        // Show error in UI
      }
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle post action (delete, hide, etc.)
  const handlePostAction = async () => {
    try {
      setActionLoading(true);
      
      const { type, id } = modalAction;
      
      if (type === 'delete') {
        // Delete post and all associated data (likes, comments, media)
        await supabase.from('forum_likes').delete().eq('post_id', id);
        await supabase.from('forum_comments').delete().eq('post_id', id);
        await supabase.from('forum_post_media').delete().eq('post_id', id);
        await supabase.from('forum_posts').delete().eq('id', id);
      } else if (type === 'hide' || type === 'approve') {
        try {
          // Try to update the status
          if (type === 'hide') {
            await supabase
              .from('forum_posts')
              .update({ status: 'hidden' })
              .eq('id', id);
          } else if (type === 'approve') {
            await supabase
              .from('forum_posts')
              .update({ status: 'active' })
              .eq('id', id);
          }
        } catch (err) {
          if (err.message && err.message.includes('column forum_posts.status does not exist')) {
            setError('Database schema is missing the status column. Please run the SQL update script.');
          } else {
            throw err;
          }
        }
      } else if (type === 'deleteComment') {
        await supabase
          .from('forum_comments')
          .delete()
          .eq('id', id);
          
        // Update local comment state to remove this comment
        setPostComments(prev => {
          const newComments = {};
          Object.keys(prev).forEach(postId => {
            newComments[postId] = prev[postId].filter(comment => comment.id !== id);
          });
          return newComments;
        });
      }
      
      // Close modal and refresh posts
      setConfirmModal(false);
      fetchPosts();
    } catch (error) {
      console.error('Error performing action:', error);
      setError('Failed to perform the requested action. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open media preview modal
  const openMediaPreview = (media) => {
    setCurrentMedia(media);
    setViewMediaModal(true);
  };

  // Render media grid for a post
  const renderMediaGrid = (media) => {
    if (!media || media.length === 0) return null;
    
    // Single media item
    if (media.length === 1) {
      return (
        <div className="forum-media-grid">
          <div 
            className="forum-media-item forum-media-1"
            onClick={() => openMediaPreview(media[0])}
          >
            {media[0].media_type === 'image' ? (
              <Image 
                src={media[0].media_url} 
                alt="Post media" 
                fluid 
                className="w-100 h-100"
              />
            ) : (
              <div className="position-relative w-100 h-100">
                <Image 
                  src={media[0].thumbnail_url || 'https://via.placeholder.com/300x200?text=Video'} 
                  alt="Video thumbnail" 
                  fluid 
                  className="w-100 h-100"
                />
                <div className="position-absolute top-50 start-50 translate-middle">
                  <FaPlay size={50} color="#FFF" />
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Two media items
    if (media.length === 2) {
      return (
        <div className="forum-media-grid">
          {media.map((item, index) => (
            <div 
              key={item.id} 
              className="forum-media-item forum-media-2"
              onClick={() => openMediaPreview(item)}
            >
              {item.media_type === 'image' ? (
                <Image 
                  src={item.media_url} 
                  alt={`Media ${index + 1}`}
                  fluid 
                  className="w-100 h-100"
                />
              ) : (
                <div className="position-relative w-100 h-100">
                  <Image 
                    src={item.thumbnail_url || 'https://via.placeholder.com/300x200?text=Video'} 
                    alt="Video thumbnail" 
                    fluid 
                    className="w-100 h-100"
                  />
                  <div className="position-absolute top-50 start-50 translate-middle">
                    <FaPlay size={30} color="#FFF" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
    
    // Three media items
    if (media.length === 3) {
      return (
        <div className="forum-media-grid">
          <div 
            className="forum-media-item forum-media-3-main"
            onClick={() => openMediaPreview(media[0])}
          >
            {media[0].media_type === 'image' ? (
              <Image 
                src={media[0].media_url} 
                alt="Main media" 
                fluid 
                className="w-100 h-100"
              />
            ) : (
              <div className="position-relative w-100 h-100">
                <Image 
                  src={media[0].thumbnail_url || 'https://via.placeholder.com/300x200?text=Video'} 
                  alt="Video thumbnail" 
                  fluid 
                  className="w-100 h-100"
                />
                <div className="position-absolute top-50 start-50 translate-middle">
                  <FaPlay size={30} color="#FFF" />
                </div>
              </div>
            )}
          </div>
          <div className="d-flex w-100">
            {media.slice(1, 3).map((item, index) => (
              <div 
                key={item.id} 
                className="forum-media-item forum-media-3-sub"
                onClick={() => openMediaPreview(item)}
              >
                {item.media_type === 'image' ? (
                  <Image 
                    src={item.media_url} 
                    alt={`Media ${index + 2}`} 
                    fluid 
                    className="w-100 h-100"
                  />
                ) : (
                  <div className="position-relative w-100 h-100">
                    <Image 
                      src={item.thumbnail_url || 'https://via.placeholder.com/300x200?text=Video'} 
                      alt="Video thumbnail" 
                      fluid 
                      className="w-100 h-100"
                    />
                    <div className="position-absolute top-50 start-50 translate-middle">
                      <FaPlay size={24} color="#FFF" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Four or more media items
    return (
      <div className="forum-media-grid">
        {media.slice(0, 4).map((item, index) => (
          <div 
            key={item.id} 
            className="forum-media-item forum-media-4"
            onClick={() => openMediaPreview(item)}
          >
            {item.media_type === 'image' ? (
              <Image 
                src={item.media_url} 
                alt={`Media ${index + 1}`} 
                fluid 
                className="w-100 h-100"
              />
            ) : (
              <div className="position-relative w-100 h-100">
                <Image 
                  src={item.thumbnail_url || 'https://via.placeholder.com/300x200?text=Video'} 
                  alt="Video thumbnail" 
                  fluid 
                  className="w-100 h-100"
                />
                <div className="position-absolute top-50 start-50 translate-middle">
                  <FaPlay size={24} color="#FFF" />
                </div>
              </div>
            )}
            
            {index === 3 && media.length > 4 && (
              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50">
                <span className="text-white fw-bold fs-4">+{media.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render post status badge
  const renderStatusBadge = (status, reportedCount) => {
    switch (status) {
      case 'active':
        return <Badge bg="success">Active</Badge>;
      case 'hidden':
        return <Badge bg="secondary">Hidden</Badge>;
      case 'pending':
        return <Badge bg="warning">Pending Review</Badge>;
      default:
        return null;
    }
  };

  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pageItems = [];
    
    // Always show first page
    pageItems.push(
      <Pagination.Item 
        key="first" 
        active={currentPage === 1}
        onClick={() => setCurrentPage(1)}
      >
        1
      </Pagination.Item>
    );
    
    // Add ellipsis if needed
    if (currentPage > 3) {
      pageItems.push(<Pagination.Ellipsis key="ellipsis1" disabled />);
    }
    
    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last page as they're always shown
      pageItems.push(
        <Pagination.Item 
          key={i} 
          active={currentPage === i}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    
    // Add ellipsis if needed
    if (currentPage < totalPages - 2) {
      pageItems.push(<Pagination.Ellipsis key="ellipsis2" disabled />);
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      pageItems.push(
        <Pagination.Item 
          key="last" 
          active={currentPage === totalPages}
          onClick={() => setCurrentPage(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    return (
      <Pagination className="justify-content-center">
        <Pagination.Prev 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        />
        {pageItems}
        <Pagination.Next 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };

  return (
    <div className="d-flex">
      <SideNav />
      <main className="flex-grow-1">
        <div className="forum-admin-header">
          <h1 className="forum-admin-title">
            <FaComments className="me-2" /> Forum Management
          </h1>
          <Button variant="success" onClick={fetchPosts}>
            <FaSync className="me-2" /> Refresh
          </Button>
        </div>
        
        <Container fluid className="forum-admin-container">
          {/* Search and filter section */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Form onSubmit={handleSearch}>
                <Row className="forum-search-filter">
                  <Col md={6} lg={7}>
                    <Form.Group className="forum-search position-relative">
                      <FaSearch className="position-absolute" style={{left: "15px", top: "12px", color: "#aaa"}} />
                      <Form.Control
                        type="text"
                        placeholder="Search posts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="ps-5"
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={3} lg={2}>
                    <Form.Group className="forum-filter">
                      <Form.Select 
                        value={filterStatus} 
                        onChange={(e) => {
                          setFilterStatus(e.target.value);
                          setCurrentPage(1);
                        }}
                      >
                        <option value="all">All Posts</option>
                        <option value="active">Active</option>
                        <option value="hidden">Hidden</option>
                        <option value="pending">Pending Review</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col md={3} lg={3} className="d-flex gap-2">
                    <Button type="submit" variant="primary" className="flex-grow-1">
                      <FaSearch className="me-1" /> Search
                    </Button>
                    
                    <Button variant="outline-secondary" onClick={clearSearch}>
                      <FaFilter className="me-1" /> Clear
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
          
          {/* Error message if any */}
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}
          
          {/* Loading indicator */}
          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="success" className="mb-3" />
              <p className="text-muted mb-0">Loading forum posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <Alert variant="info" className="text-center">
              <FaComments className="mb-3" size={30} />
              <p className="mb-0">No posts found. Try adjusting your search or filter criteria.</p>
            </Alert>
          ) : (
            /* Posts list */
            <>
              <Row>
                <Col>
                  {posts.map(post => (
                    <Card key={post.id} className="forum-card">
                      <Card.Header className="forum-card-header">
                        <div className="forum-avatar">
                          {post.profile?.avatar_url ? (
                            <Image 
                              src={post.profile.avatar_url} 
                              alt="User avatar" 
                              roundedCircle 
                              width={40} 
                              height={40} 
                            />
                          ) : (
                            post.profile?.username?.charAt(0).toUpperCase() || '?'
                          )}
                        </div>
                        
                        <div className="forum-user-info">
                          <div className="forum-username">
                            {post.profile?.username || 'Anonymous'}
                          </div>
                          <div className="forum-date">
                            {formatDate(post.created_at)}
                          </div>
                        </div>
                        
                        <div className="d-flex align-items-center">
                          {renderStatusBadge(post.status, post.reported_count)}
                          {post.reported_count > 0 && (
                            <Badge bg="danger" className="ms-2">
                              {post.reported_count} Reports
                            </Badge>
                          )}
                        </div>
                      </Card.Header>
                      
                      <Card.Body className="forum-content">
                        <p className="mb-3">{post.content}</p>
                        
                        {renderMediaGrid(post.media)}
                        
                        <div className="d-flex align-items-center mt-3">
                          <div className="me-3 d-flex align-items-center">
                            <FaHeart className="text-danger me-1" /> 
                            <span>{post.likeCount} likes</span>
                          </div>
                          <div className="d-flex align-items-center">
                            <FaComment className="text-primary me-1" /> 
                            <span>{post.commentCount} comments</span>
                          </div>
                        </div>
                      </Card.Body>
                      
                      <Card.Footer className="forum-actions">
                        <Button 
                          variant="link" 
                          className="forum-action-btn"
                          onClick={() => fetchComments(post.id)}
                        >
                          {commentsVisible[post.id] ? <FaEyeSlash /> : <FaEye />}
                          <span className="forum-action-text">
                            {commentsVisible[post.id] ? 'Hide Comments' : 'View Comments'}
                          </span>
                        </Button>
                        
                        {post.status !== 'hidden' && (
                          <Button 
                            variant="link" 
                            className="forum-action-btn"
                            onClick={() => {
                              setModalAction({ type: 'hide', id: post.id });
                              setConfirmModal(true);
                            }}
                          >
                            <FaBan />
                            <span className="forum-action-text">Hide Post</span>
                          </Button>
                        )}
                        
                        {(post.status === 'hidden' || post.status === 'pending') && (
                          <Button 
                            variant="link" 
                            className="forum-action-btn"
                            onClick={() => {
                              setModalAction({ type: 'approve', id: post.id });
                              setConfirmModal(true);
                            }}
                          >
                            <FaCheck />
                            <span className="forum-action-text">Approve Post</span>
                          </Button>
                        )}
                        
                        <Button 
                          variant="link" 
                          className="forum-action-btn danger"
                          onClick={() => {
                            setModalAction({ type: 'delete', id: post.id });
                            setConfirmModal(true);
                          }}
                        >
                          <FaTrash />
                          <span className="forum-action-text">Delete Post</span>
                        </Button>
                      </Card.Footer>
                      
                      {commentsVisible[post.id] && (
                        <div className="forum-comments">
                          <h5 className="d-flex align-items-center">
                            <FaComment className="me-2 text-primary" /> 
                            Comments ({post.commentCount})
                          </h5>
                          
                          {postComments[post.id]?.length > 0 ? (
                            postComments[post.id].map(comment => (
                              <div key={comment.id} className="forum-comment-item">
                                <div className="forum-comment-avatar">
                                  {comment.profile?.avatar_url ? (
                                    <Image 
                                      src={comment.profile.avatar_url} 
                                      alt="User avatar" 
                                      roundedCircle 
                                      width={30} 
                                      height={30} 
                                    />
                                  ) : (
                                    comment.profile?.username?.charAt(0).toUpperCase() || '?'
                                  )}
                                </div>
                                
                                <div className="forum-comment-content">
                                  <div className="forum-comment-header">
                                    <span className="forum-comment-username">
                                      {comment.profile?.username || 'Anonymous'}
                                    </span>
                                    <span className="forum-comment-date">
                                      {formatDate(comment.created_at)}
                                    </span>
                                  </div>
                                  
                                  <p className="forum-comment-text">{comment.content}</p>
                                  
                                  <div className="forum-comment-actions">
                                    <Button 
                                      variant="link" 
                                      className="p-0 text-danger" 
                                      size="sm"
                                      onClick={() => {
                                        setModalAction({ type: 'deleteComment', id: comment.id });
                                        setConfirmModal(true);
                                      }}
                                    >
                                      <small><FaTrash className="me-1" /> Delete</small>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-muted text-center py-3">No comments for this post.</p>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </Col>
              </Row>
              
              {/* Pagination */}
              <div className="mt-4 mb-5">
                {renderPagination()}
              </div>
            </>
          )}
          
          {/* Confirmation Modal */}
          <Modal show={confirmModal} onHide={() => setConfirmModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Confirm Action</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {modalAction.type === 'delete' && 'Are you sure you want to delete this post? This action cannot be undone.'}
              {modalAction.type === 'hide' && 'Are you sure you want to hide this post? It will no longer be visible to users.'}
              {modalAction.type === 'approve' && 'Are you sure you want to approve this post? It will be visible to all users.'}
              {modalAction.type === 'deleteComment' && 'Are you sure you want to delete this comment? This action cannot be undone.'}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={() => setConfirmModal(false)}>
                Cancel
              </Button>
              <Button 
                variant={modalAction.type.includes('delete') ? 'danger' : 'primary'} 
                onClick={handlePostAction}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Processing...
                  </>
                ) : (
                  'Confirm'
                )}
              </Button>
            </Modal.Footer>
          </Modal>
          
          {/* Media Viewer Modal */}
          <Modal 
            show={viewMediaModal} 
            onHide={() => setViewMediaModal(false)}
            size="lg"
            centered
            className="media-viewer-modal"
          >
            <Modal.Header closeButton>
              <Modal.Title>Media Preview</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center p-0">
              {currentMedia && (
                currentMedia.media_type === 'image' ? (
                  <Image 
                    src={currentMedia.media_url} 
                    alt="Media preview" 
                    fluid 
                    className="w-100"
                  />
                ) : (
                  <div className="ratio ratio-16x9">
                    <video 
                      src={currentMedia.media_url}
                      controls
                      className="w-100"
                    />
                  </div>
                )
              )}
            </Modal.Body>
          </Modal>
        </Container>
      </main>
    </div>
  );
};

export default ForumAdmin;
