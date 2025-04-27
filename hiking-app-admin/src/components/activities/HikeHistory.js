import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { supabase } from '../../services/supabaseClient';
import { toast } from 'react-toastify';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

const HikeHistory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hikeData, setHikeData] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [timeFrame, setTimeFrame] = useState('month');
  const [filterUser, setFilterUser] = useState('all');
  const [users, setUsers] = useState([]);

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    fetchUsers();
    fetchHikeData();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email')
        .order('username');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchHikeData = async (user = 'all', period = timeFrame) => {
    try {
      setLoading(true);
      setError(null);

      // Check if table exists
      const { error: tableError } = await supabase
        .from('hike_records')
        .select('id')
        .limit(1);
      
      if (tableError) {
        setError("The hike_records table doesn't exist yet or you don't have access to it.");
        setHikeData([]);
        setUserStats([]);
        return;
      }

      // Base query
      let query = supabase
        .from('hike_records')
        .select('*, user_id');

      // Apply user filter if specific user selected
      if (user !== 'all') {
        query = query.eq('user_id', user);
      }

      // Apply time filter
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(now.getMonth() - 1); // Default to month
      }

      query = query.gte('date', startDate.toISOString());
      
      // Execute query
      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      
      // Process the data for charts and analysis
      const processedData = await processDataForCharts(data || []);
      setHikeData(processedData);

      // Calculate user statistics
      calculateUserStatistics(data || []);
    } catch (error) {
      console.error('Error fetching hike history:', error);
      setError(`Error fetching data: ${error.message}`);
      toast.error(`Error loading hike history: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const processDataForCharts = async (data) => {
    const userProfiles = {};
    
    // First, gather all unique user IDs
    const userIds = [...new Set(data.map(item => item.user_id))];
    
    // Fetch profile data for all users at once
    for (const userId of userIds) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, email')
          .eq('id', userId)
          .single();
        
        userProfiles[userId] = profile;
      } catch (error) {
        console.error(`Error fetching profile for ${userId}:`, error);
        userProfiles[userId] = null;
      }
    }
    
    // Process the data and add profile information
    return data.map(hike => {
      const profile = userProfiles[hike.user_id];
      return {
        ...hike,
        username: profile?.username || 'Unknown User',
        email: profile?.email || 'No Email',
        formattedDate: new Date(hike.date).toLocaleDateString(),
      };
    });
  };

  const calculateUserStatistics = (data) => {
    // Group by user
    const userGroups = data.reduce((groups, hike) => {
      const key = hike.user_id;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(hike);
      return groups;
    }, {});
    
    // Calculate stats for each user
    const stats = Object.keys(userGroups).map(userId => {
      const userHikes = userGroups[userId];
      const totalDistance = userHikes.reduce((sum, hike) => sum + (hike.distance || 0), 0);
      const totalDuration = userHikes.reduce((sum, hike) => sum + (hike.duration || 0), 0);
      const totalElevation = userHikes.reduce((sum, hike) => sum + (hike.elevation || 0), 0);
      
      return {
        userId,
        hikeCount: userHikes.length,
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        totalDuration,
        totalElevation: Math.round(totalElevation),
        avgDistance: userHikes.length ? parseFloat((totalDistance / userHikes.length).toFixed(2)) : 0,
        avgDuration: userHikes.length ? Math.round(totalDuration / userHikes.length) : 0,
      };
    });
    
    setUserStats(stats);
  };

  const handleFilterChange = () => {
    fetchHikeData(filterUser, timeFrame);
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "0h 0m";
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  // Prepare data for charts
  const prepareDistanceChartData = () => {
    // Group by date and calculate totals
    const dateGroups = hikeData.reduce((acc, hike) => {
      const date = hike.formattedDate;
      if (!acc[date]) {
        acc[date] = {
          date,
          totalDistance: 0,
          hikeCount: 0
        };
      }
      acc[date].totalDistance += (hike.distance || 0);
      acc[date].hikeCount += 1;
      return acc;
    }, {});
    
    return Object.values(dateGroups).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  };

  // Prepare data for user comparison chart
  const prepareUserComparisonData = () => {
    return userStats.map(stat => ({
      name: users.find(u => u.id === stat.userId)?.username || 'Unknown',
      hikeCount: stat.hikeCount,
      totalDistance: stat.totalDistance,
      avgDistance: stat.avgDistance
    }));
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Hiking History Analytics</h2>
          <p className="text-muted">Analyze hiking patterns and user activities over time</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading>Data Unavailable</Alert.Heading>
          <p>{error}</p>
          <hr />
          <p className="mb-0">
            Make sure the hike_records table has been created in your Supabase database.
          </p>
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={6} lg={3}>
          <Form.Group>
            <Form.Label>Time Frame</Form.Label>
            <Form.Select 
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value)}
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last 12 Months</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6} lg={3}>
          <Form.Group>
            <Form.Label>User</Form.Label>
            <Form.Select 
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
            >
              <option value="all">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.username || user.email || 'User ' + user.id.slice(0, 6)}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={12} lg={6} className="d-flex align-items-end">
          <Button 
            variant="primary" 
            onClick={handleFilterChange}
            className="mt-3"
          >
            Apply Filters
          </Button>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading hiking data...</p>
        </div>
      ) : (
        <>
          <Row className="mb-4">
            <Col md={6} xl={3} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Total Hikes</Card.Title>
                  <h2 className="display-4 text-primary">{hikeData.length}</h2>
                  <Card.Text className="text-muted">
                    {timeFrame === 'week' ? 'Last 7 days' : 
                     timeFrame === 'month' ? 'Last 30 days' : 'Last 12 months'}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} xl={3} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Total Distance</Card.Title>
                  <h2 className="display-4 text-success">
                    {hikeData.reduce((sum, hike) => sum + (hike.distance || 0), 0).toFixed(1)} km
                  </h2>
                  <Card.Text className="text-muted">
                    Combined distance hiked
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} xl={3} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Average Distance</Card.Title>
                  <h2 className="display-4 text-info">
                    {hikeData.length ? 
                      (hikeData.reduce((sum, hike) => sum + (hike.distance || 0), 0) / hikeData.length).toFixed(1) : 
                      '0'} km
                  </h2>
                  <Card.Text className="text-muted">
                    Per hiking activity
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} xl={3} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Total Elevation</Card.Title>
                  <h2 className="display-4 text-warning">
                    {hikeData.reduce((sum, hike) => sum + (hike.elevation || 0), 0).toFixed(0)} m
                  </h2>
                  <Card.Text className="text-muted">
                    Combined elevation gain
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col lg={6} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Hiking Distance Over Time</Card.Title>
                  <div style={{ width: '100%', height: 300 }}>
                    {prepareDistanceChartData().length > 0 ? (
                      <ResponsiveContainer>
                        <LineChart
                          data={prepareDistanceChartData()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="totalDistance" name="Distance (km)" stroke="#8884d8" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="d-flex align-items-center justify-content-center h-100">
                        <p className="text-muted">No data available for the selected filters</p>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={6} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Hikes by User</Card.Title>
                  <div style={{ width: '100%', height: 300 }}>
                    {userStats.length > 0 ? (
                      <ResponsiveContainer>
                        <BarChart
                          data={prepareUserComparisonData()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="hikeCount" name="Number of Hikes" fill="#82ca9d" />
                          <Bar dataKey="totalDistance" name="Total Distance (km)" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="d-flex align-items-center justify-content-center h-100">
                        <p className="text-muted">No user data available</p>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col>
              <Card>
                <Card.Body>
                  <Card.Title>Detailed Hiking Records</Card.Title>
                  <div className="table-responsive">
                    <Table hover>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>User</th>
                          <th>Distance</th>
                          <th>Duration</th>
                          <th>Pace</th>
                          <th>Elevation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hikeData.map(hike => (
                          <tr key={hike.id}>
                            <td>{new Date(hike.date).toLocaleDateString()}</td>
                            <td>{hike.username}</td>
                            <td>{hike.distance ? `${hike.distance.toFixed(2)} km` : 'N/A'}</td>
                            <td>{formatDuration(hike.duration)}</td>
                            <td>
                              {hike.pace ? 
                                `${Math.floor(hike.pace)}'${Math.round((hike.pace % 1) * 60).toString().padStart(2, '0')}"/km` : 
                                'N/A'}
                            </td>
                            <td>{hike.elevation ? `${hike.elevation.toFixed(0)} m` : 'N/A'}</td>
                          </tr>
                        ))}
                        {hikeData.length === 0 && (
                          <tr>
                            <td colSpan="6" className="text-center py-3">
                              No hiking records found for the selected filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default HikeHistory;