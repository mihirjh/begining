import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, MenuItem, Select, InputLabel, FormControl, Alert, CircularProgress, TextField } from '@mui/material';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

export default function TestAssign() {
  const { testId } = useParams();
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch all students (for demo, fetch all users with role student)
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/users', { headers: { Authorization: `Bearer ${token}` } });
        setStudents(res.data.filter(u => u.role === 'student'));
      } catch {
        setStudents([]);
      }
    };
    fetchStudents();
  }, []);

  const handleAssign = async () => {
    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/v1/tests/${testId}/assign`, {
        user_ids: selected,
        start_time: startTime,
        end_time: endTime,
        attempt_limit: attemptLimit
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Test assigned!');
      setTimeout(() => navigate('/tests'), 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to assign test');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Assign Test</Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Students</InputLabel>
        <Select
          multiple
          value={selected}
          onChange={e => setSelected(e.target.value)}
          renderValue={selected => selected.map(id => {
            const s = students.find(u => u.id === id);
            return s ? s.name || s.email : id;
          }).join(', ')}
        >
          {students.map(s => (
            <MenuItem key={s.id} value={s.id}>{s.name || s.email}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField label="Start Time" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
      <TextField label="End Time" type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
      <TextField label="Attempt Limit" type="number" value={attemptLimit} onChange={e => setAttemptLimit(e.target.value)} fullWidth sx={{ mb: 2 }} />
      {message && <Alert severity={message === 'Test assigned!' ? 'success' : 'error'}>{message}</Alert>}
      <Button variant="contained" color="primary" onClick={handleAssign} disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Assign Test'}</Button>
    </Box>
  );
}
