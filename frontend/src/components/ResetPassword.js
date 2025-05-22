import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Alert } from '@mui/material';
import axios from 'axios';

axios.defaults.baseURL = 'http://127.0.0.1:5000/';

export default function ResetPassword() {
  const [form, setForm] = useState({ resetToken: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    if (form.newPassword !== form.confirmPassword) {
      setSeverity('error');
      setMessage('Passwords do not match');
      return;
    }
    try {
      await axios.post('/auth/reset-password', {
        resetToken: form.resetToken,
        newPassword: form.newPassword
      });
      setSeverity('success');
      setMessage('Password reset successful! You can now login.');
    } catch (err) {
      setSeverity('error');
      setMessage(err.response?.data?.message || 'Password reset failed');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h5">Reset Password</Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, width: '100%' }}>
          <TextField label="Reset Token" name="resetToken" value={form.resetToken} onChange={handleChange} fullWidth margin="normal" required />
          <TextField label="New Password" name="newPassword" type="password" value={form.newPassword} onChange={handleChange} fullWidth margin="normal" required />
          <TextField label="Confirm New Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} fullWidth margin="normal" required />
          {message && <Alert severity={severity} sx={{ mt: 2 }}>{message}</Alert>}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>Reset Password</Button>
        </Box>
      </Box>
    </Container>
  );
}
