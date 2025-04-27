import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';

const SideNav = () => {
  const location = useLocation();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="bg-dark text-white d-flex flex-column p-3" style={{ width: '250px', minHeight: '100vh' }}>
      <h3 className="mb-4 text-center">ASCENTRA ADMIN PAGE</h3>
      <Nav className="flex-column mb-auto">
        <Nav.Item>
          <Nav.Link 
            as={Link} 
            to="/dashboard" 
            className={`text-white ${location.pathname === '/dashboard' ? 'bg-primary' : ''}`}
          >
            Dashboard
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            as={Link} 
            to="/users" 
            className={`text-white ${location.pathname === '/users' ? 'bg-primary' : ''}`}
          >
            User Management
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            as={Link} 
            to="/trails" 
            className={`text-white ${location.pathname === '/trails' ? 'bg-primary' : ''}`}
          >
            Trail Management
          </Nav.Link>
        </Nav.Item>
      </Nav>
      <button 
        className="btn btn-outline-light mt-4"
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );
};

export default SideNav;