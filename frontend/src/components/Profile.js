import React, { useEffect, useState } from 'react';
import { Container, Box, Typography, TextField, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

axios.defaults.baseURL = 'http://127.0.0.1:5000/';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', password: '' });
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/users/profile', {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        setProfile(res.data);
        setForm({ name: res.data.name || '', password: '' });
      } catch (err) {
        setMessage('Failed to load profile');
        setSeverity('error');
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('/users/profile', form, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      setProfile(res.data);
      setMessage('Profile updated!');
      setSeverity('success');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Update failed');
      setSeverity('error');
    }
  };

  const handleDelete = async () => {
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      await axios.delete('/users/profile', {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      setMessage('Profile deleted. Logging out...');
      setSeverity('success');
      setTimeout(() => {
        localStorage.removeItem('token');
        navigate('/login');
      }, 1500);
    } catch (err) {
      setMessage('Delete failed');
      setSeverity('error');
    }
  };

  if (!profile) return null;

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h5">Profile</Typography>
        <Box component="form" onSubmit={handleUpdate} sx={{ mt: 2, width: '100%' }}>
          <TextField label="Email" value={profile.email} fullWidth margin="normal" disabled />
          <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth margin="normal" />
          <TextField label="New Password" name="password" type="password" value={form.password} onChange={handleChange} fullWidth margin="normal" />
          {message && <Alert severity={severity} sx={{ mt: 2 }}>{message}</Alert>}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>Save Changes</Button>
          <Button fullWidth color="error" sx={{ mt: 1 }} onClick={handleDelete}>Delete Profile</Button>
        </Box>
      </Box>
    </Container>
  );
}
