import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Alert } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function TestDetail() {
  const { testId } = useParams();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/v1/tests/${testId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTest(res.data);
      } catch (err) {
        setError('Test not found');
      }
      setLoading(false);
    };
    fetchTest();
  }, [testId]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!test) return null;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>{test.name}</Typography>
      <Typography variant="subtitle1">Pattern: {test.pattern}</Typography>
      <Typography variant="subtitle1">Duration: {test.duration_minutes} min</Typography>
      <Typography variant="subtitle1">Start: {test.start_time}</Typography>
      <Typography variant="subtitle1">End: {test.end_time}</Typography>
      <Typography variant="subtitle1">Questions:</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        {test.questions && test.questions.length > 0 ? (
          <ul>
            {test.questions.map(q => <li key={q.id}>{q.content}</li>)}
          </ul>
        ) : 'No questions.'}
      </Paper>
      <Button variant="contained" onClick={() => navigate(`/tests/${testId}/attempt`)}>Take Test</Button>
    </Box>
  );
}
