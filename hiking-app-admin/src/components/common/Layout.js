import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import SideNav from './SideNav';

const Layout = ({ children }) => {
  return (
    <div className="d-flex">
      <SideNav />
      <div className="flex-grow-1">
        {children}
      </div>
    </div>
  );
};

export default Layout;