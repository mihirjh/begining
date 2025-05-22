import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, Typography, IconButton, Checkbox, FormControlLabel, Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

// Set up axios base URL (no CORS/security settings)
axios.defaults.baseURL = 'http://127.0.0.1:5000/';

// Helper to get JWT token from localStorage
const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const questionTypes = [
  { value: 'mcq_single', label: 'MCQ (Single)' },
  { value: 'mcq_multiple', label: 'MCQ (Multiple)' },
  { value: 'true_false', label: 'True/False' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
];

export default function QuestionModal({ open, onClose, onSaved, editQuestion }) {
  const [form, setForm] = useState(editQuestion || {
    subject_id: '', topic_id: '', question_type: '', content: '', difficulty: '', explanation: '', options: []
  });
  const [optionText, setOptionText] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    setForm(editQuestion || { subject_id: '', topic_id: '', question_type: '', content: '', difficulty: '', explanation: '', options: [] });
    setOptionText('');
    setError('');
  }, [editQuestion, open]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddOption = () => {
    if (!optionText.trim()) return;
    setForm({ ...form, options: [...form.options, { option_text: optionText, is_correct: false }] });
    setOptionText('');
  };

  const handleOptionChange = (idx, key, value) => {
    const opts = [...form.options];
    opts[idx][key] = value;
    setForm({ ...form, options: opts });
  };

  const handleDeleteOption = idx => {
    const opts = [...form.options];
    opts.splice(idx, 1);
    setForm({ ...form, options: opts });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      if (editQuestion) {
        await axios.put(`/api/v1/questions/${editQuestion.id}`, form, getAuthHeader());
      } else {
        await axios.post('/api/v1/questions', form, getAuthHeader());
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{editQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Question Type" name="question_type" select value={form.question_type} onChange={handleChange} fullWidth required>
                {questionTypes.map(qt => <MenuItem key={qt.value} value={qt.value}>{qt.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Difficulty" name="difficulty" value={form.difficulty} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Question Text" name="content" value={form.content} onChange={handleChange} fullWidth required multiline minRows={2} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Explanation" name="explanation" value={form.explanation} onChange={handleChange} fullWidth multiline minRows={2} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2 }}>Options</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <TextField label="Option text" value={optionText} onChange={e => setOptionText(e.target.value)} size="small" />
                <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddOption}>Add</Button>
              </Box>
              {form.options.map((opt, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TextField value={opt.option_text} onChange={e => handleOptionChange(idx, 'option_text', e.target.value)} size="small" sx={{ mr: 1 }} />
                  <FormControlLabel control={<Checkbox checked={!!opt.is_correct} onChange={e => handleOptionChange(idx, 'is_correct', e.target.checked)} />} label="Correct" />
                  <IconButton color="error" onClick={() => handleDeleteOption(idx)}><DeleteIcon /></IconButton>
                </Box>
              ))}
            </Grid>
          </Grid>
          {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
