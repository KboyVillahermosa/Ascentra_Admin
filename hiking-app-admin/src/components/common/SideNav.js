import React, { useState, useEffect } from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { 
  FaTachometerAlt, FaUsers, FaMountain, FaCamera, 
  FaMapMarkedAlt, FaSignOutAlt, FaHistory, FaBars, FaTimes, FaComments 
} from 'react-icons/fa';

const SideNav = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && !sidebarOpen) setSidebarOpen(true);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      {isMobile && (
        <div className="mobile-nav-toggle" onClick={toggleSidebar}>
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </div>
      )}
      
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`} 
           style={{ 
             width: isMobile ? (sidebarOpen ? '250px' : '0') : '250px',
             minHeight: '100vh',
             position: isMobile ? 'fixed' : 'relative',
             transition: 'all 0.3s',
             zIndex: 1000
           }}>
        
        <div className="d-flex flex-column p-3 h-100">
          <h3 className="mb-4 text-center sidebar-title">ASCENTRA ADMIN</h3>
          
          <Nav className="flex-column mb-auto">
            <Nav.Item>
              <Nav.Link 
                as={Link} 
                to="/dashboard" 
                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                <FaTachometerAlt className="me-2" /> Dashboard
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                as={Link} 
                to="/users" 
                className={`nav-link ${location.pathname === '/users' ? 'active' : ''}`}
              >
                <FaUsers className="me-2" /> User Management
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                as={Link} 
                to="/trails" 
                className={`nav-link ${location.pathname === '/trails' ? 'active' : ''}`}
              >
                <FaMountain className="me-2" /> Trail Management
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                as={Link} 
                to="/social" 
                className={`nav-link ${location.pathname === '/social' ? 'active' : ''}`}
              >
                <FaCamera className="me-2" /> Social Media
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                as={Link} 
                to="/activities" 
                className={`nav-link ${location.pathname === '/activities' ? 'active' : ''}`}
              >
                <FaMapMarkedAlt className="me-2" /> Hiking Activities
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                as={Link} 
                to="/hike-history" 
                className={`nav-link ${location.pathname === '/hike-history' ? 'active' : ''}`}
              >
                <FaHistory className="me-2" /> Hike History
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                as={Link} 
                to="/forum-admin" 
                className={`nav-link ${location.pathname === '/forum-admin' ? 'active' : ''}`}
              >
                <FaComments className="me-2" /> Forum Admin
              </Nav.Link>
            </Nav.Item>
          </Nav>
          
          <button 
            className="btn logout-btn mt-4"
            onClick={handleLogout}
          >
            <FaSignOutAlt className="me-2" /> Logout
          </button>
        </div>
      </div>
      
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default SideNav;