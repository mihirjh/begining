import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Alert } from '@mui/material';
import axios from 'axios';

axios.defaults.baseURL = 'http://127.0.0.1:5000/';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success');

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      await axios.post('/auth/forgot-password', { email });
      setSeverity('success');
      setMessage('Password reset link sent! Check your email.');
    } catch (err) {
      setSeverity('error');
      setMessage(err.response?.data?.message || 'Failed to send reset link');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h5">Forgot Password</Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, width: '100%' }}>
          <TextField label="Email" value={email} onChange={e => setEmail(e.target.value)} fullWidth margin="normal" required />
          {message && <Alert severity={severity} sx={{ mt: 2 }}>{message}</Alert>}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>Send Reset Link</Button>
        </Box>
      </Box>
    </Container>
  );
}
