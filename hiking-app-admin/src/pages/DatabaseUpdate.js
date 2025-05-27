import React, { useState } from 'react';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { supabase } from '../services/supabaseClient';
import SideNav from '../components/common/SideNav';

const DatabaseUpdate = () => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const updateSchema = async () => {
    try {
      setUpdating(true);
      setError(null);
      setSuccess(false);
      
      // Run the SQL queries to add missing columns
      const queries = [
        `ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`,
        `ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS reported_count INTEGER DEFAULT 0`,
        `CREATE INDEX IF NOT EXISTS forum_posts_status_idx ON public.forum_posts(status)`,
        `UPDATE public.forum_posts SET status = 'active' WHERE status IS NULL`,
        `UPDATE public.forum_posts SET reported_count = 0 WHERE reported_count IS NULL`
      ];
      
      for (const query of queries) {
        const { error } = await supabase.rpc('exec_sql', { query });
        if (error) throw error;
      }
      
      setSuccess(true);
    } catch (error) {
      console.error('Error updating database schema:', error);
      setError(error.message || 'Failed to update the database schema.');
    } finally {
      setUpdating(false);
    }
  };
  
  return (
    <div className="d-flex">
      <SideNav />
      <main className="flex-grow-1 p-4">
        <Container>
          <h1 className="mb-4">Database Schema Update</h1>
          
          <Card className="mb-4">
            <Card.Header as="h5">Forum Posts Schema Update</Card.Header>
            <Card.Body>
              <Card.Title>Missing Columns in forum_posts Table</Card.Title>
              <Card.Text>
                If you're experiencing errors with the Forum Admin panel related to missing columns, 
                click the button below to add the required columns to your database schema:
                <ul className="mt-3">
                  <li><code>status</code> - Tracks post status (active, hidden, pending)</li>
                  <li><code>reported_count</code> - Tracks number of reports on a post</li>
                </ul>
              </Card.Text>
              
              {error && (
                <Alert variant="danger">
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert variant="success">
                  Database schema updated successfully! You can now use the Forum Admin panel.
                </Alert>
              )}
              
              <Button 
                variant="primary" 
                onClick={updateSchema}
                disabled={updating}
              >
                {updating ? (
                  <>
                    <Spinner 
                      as="span" 
                      animation="border" 
                      size="sm" 
                      role="status" 
                      aria-hidden="true" 
                      className="me-2" 
                    />
                    Updating Schema...
                  </>
                ) : 'Update Database Schema'}
              </Button>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header as="h5">Manual Update</Card.Header>
            <Card.Body>
              <Card.Title>SQL Script for Manual Update</Card.Title>
              <Card.Text>
                If the automatic update doesn't work, you can manually run the following SQL
                script in your Supabase SQL Editor:
              </Card.Text>
              
              <pre className="bg-dark text-light p-3 rounded" style={{ whiteSpace: 'pre-wrap' }}>
{`-- Add missing columns to forum_posts table
ALTER TABLE public.forum_posts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE public.forum_posts
ADD COLUMN IF NOT EXISTS reported_count INTEGER DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS forum_posts_status_idx ON public.forum_posts(status);

-- Update existing posts to have the 'active' status
UPDATE public.forum_posts SET status = 'active' WHERE status IS NULL;
UPDATE public.forum_posts SET reported_count = 0 WHERE reported_count IS NULL;`}
              </pre>
            </Card.Body>
          </Card>
        </Container>
      </main>
    </div>
  );
};

export default DatabaseUpdate;
