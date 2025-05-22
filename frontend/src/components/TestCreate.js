import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, MenuItem, Checkbox, ListItemText, OutlinedInput, Select, CircularProgress, Alert, Paper, IconButton, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import PreviewIcon from '@mui/icons-material/Visibility';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function TestCreate() {
  const [form, setForm] = useState({
    name: '', subject_id: '', pattern: '', duration_minutes: 60, start_time: '', end_time: '', attempt_limit: 1, question_ids: []
  });
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]); // For drag-and-drop order
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/v1/questions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuestions(res.data);
      } catch {
        setQuestions([]);
      }
    };
    fetchQuestions();
  }, []);

  // Keep selectedQuestions in sync with form.question_ids
  useEffect(() => {
    setSelectedQuestions(
      form.question_ids.map(qid => questions.find(q => q.id === qid)).filter(Boolean)
    );
  }, [form.question_ids, questions]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleQuestionSelect = e => {
    const ids = e.target.value;
    setForm({ ...form, question_ids: ids });
  };

  // Drag and drop reorder
  const onDragEnd = result => {
    if (!result.destination) return;
    const reordered = Array.from(selectedQuestions);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setSelectedQuestions(reordered);
    setForm({ ...form, question_ids: reordered.map(q => q.id) });
  };

  // Filter questions for search
  const filteredQuestions = questions.filter(q =>
    q.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/v1/tests', { ...form, question_ids: selectedQuestions.map(q => q.id) }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Test created!');
      setTimeout(() => navigate('/tests'), 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create test');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Create Test</Typography>
      <form onSubmit={handleSubmit}>
        <TextField label="Test Name" name="name" value={form.name} onChange={handleChange} fullWidth required sx={{ mb: 2 }} />
        <TextField label="Pattern" name="pattern" value={form.pattern} onChange={handleChange} fullWidth required sx={{ mb: 2 }} />
        <TextField label="Duration (minutes)" name="duration_minutes" type="number" value={form.duration_minutes} onChange={handleChange} fullWidth required sx={{ mb: 2 }} />
        <TextField label="Start Time" name="start_time" type="datetime-local" value={form.start_time} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
        <TextField label="End Time" name="end_time" type="datetime-local" value={form.end_time} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
        <TextField label="Attempt Limit" name="attempt_limit" type="number" value={form.attempt_limit} onChange={handleChange} fullWidth sx={{ mb: 2 }} />
        <TextField label="Search Questions" value={search} onChange={e => setSearch(e.target.value)} fullWidth sx={{ mb: 2 }} />
        <Select
          multiple
          value={form.question_ids}
          onChange={handleQuestionSelect}
          input={<OutlinedInput label="Questions" />}
          renderValue={selected => selected.length + " selected"}
          fullWidth
          sx={{ mb: 2 }}
        >
          {filteredQuestions.map(q => (
            <MenuItem key={q.id} value={q.id}>
              <Checkbox checked={form.question_ids.indexOf(q.id) > -1} />
              <ListItemText primary={q.content} />
              <IconButton size="small" onClick={e => { e.stopPropagation(); setPreviewQuestion(q); }}><PreviewIcon /></IconButton>
            </MenuItem>
          ))}
        </Select>
        <Typography variant="h6" sx={{ mt: 3 }}>Selected Questions (Drag to reorder):</Typography>
        <Paper sx={{ p: 2, mb: 2, minHeight: 100 }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="selected-questions">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {selectedQuestions.map((q, idx) => (
                    <Draggable key={q.id} draggableId={q.id.toString()} index={idx}>
                      {(provided) => (
                        <Box ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 1, bgcolor: '#f3e5f5', borderRadius: 2 }}>
                          <Typography sx={{ flex: 1 }}>{q.content}</Typography>
                          <IconButton size="small" onClick={() => setPreviewQuestion(q)}><PreviewIcon /></IconButton>
                          <Button color="error" size="small" onClick={() => setForm({ ...form, question_ids: form.question_ids.filter(id => id !== q.id) })}>Remove</Button>
                        </Box>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </Paper>
        {message && <Alert severity={message === 'Test created!' ? 'success' : 'error'}>{message}</Alert>}
        <Button type="submit" variant="contained" color="primary" disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Create Test'}</Button>
      </form>
      <Dialog open={!!previewQuestion} onClose={() => setPreviewQuestion(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Question Preview</DialogTitle>
        <DialogContent>
          {previewQuestion && (
            <Box>
              <Typography variant="subtitle1">{previewQuestion.content}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>Type: {previewQuestion.question_type}</Typography>
              <Typography variant="body2">Difficulty: {previewQuestion.difficulty}</Typography>
              <Typography variant="body2">Explanation: {previewQuestion.explanation}</Typography>
              {previewQuestion.options && previewQuestion.options.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">Options:</Typography>
                  <ul>
                    {previewQuestion.options.map(opt => (
                      <li key={opt.id}>{opt.option_text} {opt.is_correct ? '(Correct)' : ''}</li>
                    ))}
                  </ul>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
