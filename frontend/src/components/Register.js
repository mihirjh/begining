import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, MenuItem, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

axios.defaults.baseURL = 'http://127.0.0.1:5000';

const roles = [
  { value: 'student', label: 'Student' },
  { value: 'admin', label: 'Admin' }
];

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', role: 'student' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await axios.post('/auth/register', {
        email: form.email,
        password: form.password,
        role: form.role
      });
      setSuccess('Registration successful! Please check your email to verify your account.');
      setTimeout(() => navigate('/auth/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h5">Register</Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, width: '100%' }}>
          <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth margin="normal" required />
          <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} fullWidth margin="normal" required />
          <TextField label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} fullWidth margin="normal" required />
          <TextField select label="Role" name="role" value={form.role} onChange={handleChange} fullWidth margin="normal">
            {roles.map(option => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </TextField>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>Register</Button>
          <Button fullWidth sx={{ mt: 1 }} onClick={() => navigate('/auth/login')}>Already have an account? Login</Button>
        </Box>
      </Box>
    </Container>
  );
}
