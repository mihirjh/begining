import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Alert, LinearProgress
} from '@mui/material';
import axios from 'axios';

// Set up axios base URL (no CORS/security settings)
axios.defaults.baseURL = 'http://127.0.0.1:5000/';

export default function BulkUploadModal({ open, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = e => {
    setFile(e.target.files[0]);
    setResult(null);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/v1/questions/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: token ? `Bearer ${token}` : ''
        },
      });
      setResult(res.data);
      onUploaded();
    } catch (err) {
      setError(err.response?.data?.message || 'Bulk upload failed');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Bulk Upload Questions</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Upload a CSV file with columns: subject_id, topic_id, question_type, content, difficulty, explanation, options (as JSON or semicolon-separated).
        </Typography>
        <input type="file" accept=".csv" onChange={handleFileChange} />
        {loading && <LinearProgress sx={{ mt: 2 }} />}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {result && (
          <Box sx={{ mt: 2 }}>
            <Alert severity={result.error_count ? 'warning' : 'success'}>
              {result.summary}
            </Alert>
            {result.errors && result.errors.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Errors:</Typography>
                <ul>
                  {result.errors.map((e, i) => <li key={i}>{`Row ${e.row}: ${e.message}`}</li>)}
                </ul>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handleUpload} variant="contained" disabled={!file || loading}>Upload</Button>
      </DialogActions>
    </Dialog>
  );
}
