import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Alert } from '@mui/material';
import axios from 'axios';

axios.defaults.baseURL = 'http://127.0.0.1:5000/';

export default function VerifyEmail() {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success');

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      await axios.post('/auth/verify-email', { token });
      setSeverity('success');
      setMessage('Email verified successfully! You can now login.');
    } catch (err) {
      setSeverity('error');
      setMessage(err.response?.data?.message || 'Verification failed');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h5">Verify Email</Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, width: '100%' }}>
          <TextField label="Verification Token" value={token} onChange={e => setToken(e.target.value)} fullWidth margin="normal" required />
          {message && <Alert severity={severity} sx={{ mt: 2 }}>{message}</Alert>}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>Verify</Button>
        </Box>
      </Box>
    </Container>
  );
}
