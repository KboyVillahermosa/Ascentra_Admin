import React, { useState, useEffect, useCallback } from 'react';
import { Card } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../services/supabaseClient';

const ActivitySummary = () => {
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Define getSampleData function first
  const getSampleData = () => {
    return [
      { name: 'Jan', visits: 400, reviews: 240 },
      { name: 'Feb', visits: 300, reviews: 139 },
      { name: 'Mar', visits: 200, reviews: 980 },
      { name: 'Apr', visits: 278, reviews: 390 },
      { name: 'May', visits: 189, reviews: 480 },
      { name: 'Jun', visits: 239, reviews: 380 },
    ];
  };
  
  // Memoize the process function with useCallback
  const processDataForChart = useCallback((data) => {
    // If you have real data, process it here
    if (data && data.length > 0) {
      // Example processing - group by month
      try {
        // This is a simplified example
        // You would implement actual processing based on your data structure
        return data;
      } catch (error) {
        console.error("Error processing chart data:", error);
        return getSampleData();
      }
    }
    return getSampleData();
  }, []);

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        setLoading(true);
        
        // Query your actual table that contains user activity data
        const { data, error } = await supabase
          .from('trail_visits') // Replace with your actual table name
          .select('*');
          
        if (error) {
          throw error;
        }
        
        const chartData = processDataForChart(data);
        setActivityData(chartData);
      } catch (error) {
        console.error("Error fetching activity data:", error);
        setActivityData(getSampleData());
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivityData();
  }, [processDataForChart]);

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">Activity Summary</h5>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={activityData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="visits" fill="#8884d8" name="Trail Visits" />
              <Bar dataKey="reviews" fill="#82ca9d" name="Reviews" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card.Body>
    </Card>
  );
};

export default ActivitySummary;