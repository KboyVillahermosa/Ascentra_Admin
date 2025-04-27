import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { 
  FaTachometerAlt, FaUsers, FaMountain, FaCamera, 
  FaMapMarkedAlt, FaSignOutAlt, FaHistory 
} from 'react-icons/fa';

const SideNav = () => {
  const location = useLocation();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="bg-dark text-white d-flex flex-column p-3" style={{ width: '250px', minHeight: '100vh' }}>
      <h3 className="mb-4 text-center">ASCENTRA ADMIN</h3>
      <Nav className="flex-column mb-auto">
        <Nav.Item>
          <Nav.Link 
            as={Link} 
            to="/dashboard" 
            className={`text-white ${location.pathname === '/dashboard' ? 'bg-primary' : ''}`}
          >
            <FaTachometerAlt className="me-2" /> Dashboard
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            as={Link} 
            to="/users" 
            className={`text-white ${location.pathname === '/users' ? 'bg-primary' : ''}`}
          >
            <FaUsers className="me-2" /> User Management
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            as={Link} 
            to="/trails" 
            className={`text-white ${location.pathname === '/trails' ? 'bg-primary' : ''}`}
          >
            <FaMountain className="me-2" /> Trail Management
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            as={Link} 
            to="/social" 
            className={`text-white ${location.pathname === '/social' ? 'bg-primary' : ''}`}
          >
            <FaCamera className="me-2" /> Social Media
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            as={Link} 
            to="/activities" 
            className={`text-white ${location.pathname === '/activities' ? 'bg-primary' : ''}`}
          >
            <FaMapMarkedAlt className="me-2" /> Hiking Activities
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            as={Link} 
            to="/hike-history" 
            className={`text-white ${location.pathname === '/hike-history' ? 'bg-primary' : ''}`}
          >
            <FaHistory className="me-2" /> Hike History
          </Nav.Link>
        </Nav.Item>
      </Nav>
      <button 
        className="btn btn-outline-light mt-4"
        onClick={handleLogout}
      >
        <FaSignOutAlt className="me-2" /> Logout
      </button>
    </div>
  );
};

export default SideNav;