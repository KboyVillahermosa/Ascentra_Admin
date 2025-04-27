import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import SideNav from '../common/SideNav';
import UserStats from './UserStats';
import ActivitySummary from './ActivitySummary';

const Dashboard = () => {
  return (
    <div className="d-flex">
      <SideNav />
      <main className="flex-grow-1 p-4">
        <Container fluid>
          <h1 className="mb-4">Dashboard</h1>
          <Row>
            <Col>
              <UserStats />
            </Col>
          </Row>
          <Row>
            <Col>
              <ActivitySummary />
            </Col>
          </Row>
        </Container>
      </main>
    </div>
  );
};

export default Dashboard;