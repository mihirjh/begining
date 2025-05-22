import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Set up axios base URL
axios.defaults.baseURL = 'http://127.0.0.1:5000/';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      // Use a plain axios instance for login (no token attached)
      const res = await axios.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h5">Login</Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, width: '100%' }}>
          <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth margin="normal" required />
          <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} fullWidth margin="normal" required />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>Login</Button>
          <Button fullWidth sx={{ mt: 1 }} onClick={() => navigate('/forgot-password')}>Forgot Password?</Button>
          <Button fullWidth sx={{ mt: 1 }} onClick={() => navigate('/register')}>Don't have an account? Register</Button>
        </Box>
      </Box>
    </Container>
  );
}
