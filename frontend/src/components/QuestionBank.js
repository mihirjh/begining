import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, TextField, MenuItem, Toolbar, Tooltip, CircularProgress, Snackbar, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios';

// Set up axios base URL (no CORS/security settings)
axios.defaults.baseURL = 'http://127.0.0.1:5000/';

import QuestionModal from './QuestionModal';
import BulkUploadModal from './BulkUploadModal';

const questionTypes = [
  { value: 'mcq_single', label: 'MCQ (Single)' },
  { value: 'mcq_multiple', label: 'MCQ (Multiple)' },
  { value: 'true_false', label: 'True/False' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
];

// Helper to get JWT token from localStorage
const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterType) params.question_type = filterType;
      const res = await axios.get('/api/v1/questions', { ...getAuthHeader(), params });
      setQuestions(res.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load questions', severity: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, [search, filterType]);

  const handleEdit = (q) => { setEditQuestion(q); setModalOpen(true); };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await axios.delete(`/api/v1/questions/${id}`, getAuthHeader());
      setSnackbar({ open: true, message: 'Deleted!', severity: 'success' });
      fetchQuestions();
    } catch {
      setSnackbar({ open: true, message: 'Delete failed', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Toolbar sx={{ justifyContent: 'space-between', pl: 0 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: '#ff4081' }}>Question Bank</Typography>
        <Box>
          <Tooltip title="Bulk Upload"><IconButton color="secondary" onClick={() => setBulkOpen(true)}><UploadFileIcon /></IconButton></Tooltip>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => { setEditQuestion(null); setModalOpen(true); }} sx={{ ml: 2 }}>Add Question</Button>
        </Box>
      </Toolbar>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField label="Search" value={search} onChange={e => setSearch(e.target.value)} size="small" />
        <TextField select label="Type" value={filterType} onChange={e => setFilterType(e.target.value)} size="small" sx={{ minWidth: 150 }}>
          <MenuItem value="">All Types</MenuItem>
          {questionTypes.map(qt => <MenuItem key={qt.value} value={qt.value}>{qt.label}</MenuItem>)}
        </TextField>
      </Box>
      {loading ? <CircularProgress /> : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Question</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Difficulty</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {questions.map(q => (
                <TableRow key={q.id}>
                  <TableCell>{q.content}</TableCell>
                  <TableCell>{q.question_type}</TableCell>
                  <TableCell>{q.difficulty}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton onClick={() => handleEdit(q)}><EditIcon /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton color="error" onClick={() => handleDelete(q.id)}><DeleteIcon /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <QuestionModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetchQuestions} editQuestion={editQuestion} />
      <BulkUploadModal open={bulkOpen} onClose={() => setBulkOpen(false)} onUploaded={fetchQuestions} />
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
