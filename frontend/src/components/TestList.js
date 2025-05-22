import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, Paper, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function TestList() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/v1/tests', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTests(res.data);
      } catch (err) {
        setTests([]);
      }
      setLoading(false);
    };
    fetchTests();
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Tests</Typography>
      <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={() => navigate('/tests/create')}>Create Test</Button>
      {loading ? <CircularProgress /> : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Pattern</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Published</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tests.map(test => (
                <TableRow key={test.id}>
                  <TableCell>{test.name}</TableCell>
                  <TableCell>{test.pattern}</TableCell>
                  <TableCell>{test.duration_minutes} min</TableCell>
                  <TableCell>{test.is_published ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => navigate(`/tests/${test.id}`)}>View</Button>
                    <Button size="small" onClick={() => navigate(`/tests/${test.id}/assign`)}>Assign</Button>
                    <Button size="small" onClick={() => navigate(`/tests/${test.id}/analytics`)}>Analytics</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
