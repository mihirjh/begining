import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function TestAnalytics() {
  const { testId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/v1/tests/${testId}/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAnalytics(res.data);
      } catch (err) {
        setError('Could not fetch analytics');
      }
      setLoading(false);
    };
    fetchAnalytics();
  }, [testId]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!analytics) return null;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Test Analytics</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography>Average Score: {analytics.average_score}</Typography>
        <Typography>Highest Score: {analytics.highest_score}</Typography>
        <Typography>Lowest Score: {analytics.lowest_score}</Typography>
        <Typography>Total Attempts: {analytics.total_attempts}</Typography>
        {/* Add more analytics as needed */}
      </Paper>
    </Box>
  );
}
