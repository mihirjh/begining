import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function TestResults() {
  const { testId } = useParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/v1/tests/${testId}/results`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setResults(res.data);
      } catch (err) {
        setError('Could not fetch results');
      }
      setLoading(false);
    };
    fetchResults();
  }, [testId]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Test Results</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        {results.length === 0 ? 'No results.' : (
          <ul>
            {results.map(r => (
              <li key={r.id}>Score: {r.score} | Status: {r.is_graded ? 'Graded' : 'Pending'}</li>
            ))}
          </ul>
        )}
      </Paper>
    </Box>
  );
}
