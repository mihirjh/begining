import React, { useEffect, useState } from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

axios.defaults.baseURL = 'http://127.0.0.1:5000/';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/users/profile', {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        setProfile(res.data);
      } catch {
        navigate('/auth/login');
      }
    };
    fetchProfile();
  }, [navigate]);

  if (!profile) return null;

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4">Welcome, {profile.name || profile.email}!</Typography>
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Role: {profile.role}
        </Typography>
        <Button sx={{ mt: 4 }} variant="contained" onClick={() => navigate('/profile')}>Go to Profile</Button>
        <Button sx={{ mt: 2 }} color="error" onClick={() => {
          localStorage.removeItem('token');
          navigate('/auth/login');
        }}>Logout</Button>
      </Box>
    </Container>
  );
}
