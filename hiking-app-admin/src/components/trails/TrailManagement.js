import React from 'react';
import { Container } from 'react-bootstrap';
import SideNav from '../common/SideNav';

const TrailManagement = () => {
  return (
    <div className="d-flex">
      <SideNav />
      <main className="flex-grow-1 p-4">
        <Container fluid>
          <h1 className="mb-4">Trail Management</h1>
          {/* Trail management functionality will go here */}
          <p>Implement trail management functionality here.</p>
        </Container>
      </main>
    </div>
  );
};

export default TrailManagement;