import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Alert } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function TestAttempt() {
  const { testId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/v1/tests/${testId}/questions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuestions(res.data);
      } catch (err) {
        setQuestions([]);
      }
      setLoading(false);
    };
    fetchQuestions();
  }, [testId]);

  const handleChange = (qid, value) => setAnswers({ ...answers, [qid]: value });

  const handleSubmit = async () => {
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/v1/tests/${testId}/attempt`, { answers: Object.entries(answers).map(([question_id, answer]) => ({ question_id, answer })) }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmitted(true);
      setMessage('Test submitted!');
      setTimeout(() => navigate(`/tests/${testId}/results`), 1000);
    } catch (err) {
      setMessage('Submission failed');
    }
  };

  if (loading) return <CircularProgress />;
  if (submitted) return <Alert severity="success">Test submitted!</Alert>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Test Attempt</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        {questions.map(q => (
          <Box key={q.id} sx={{ mb: 2 }}>
            <Typography variant="subtitle1">{q.content}</Typography>
            {/* For MCQ, render options as radio buttons; for short answer, use text field */}
            {q.options && q.options.length > 0 ? (
              <Box>
                {q.options.map(opt => (
                  <Button key={opt.id} variant={answers[q.id] === opt.id ? 'contained' : 'outlined'} sx={{ mr: 1, mb: 1 }} onClick={() => handleChange(q.id, opt.id)}>{opt.option_text}</Button>
                ))}
              </Box>
            ) : (
              <input type="text" value={answers[q.id] || ''} onChange={e => handleChange(q.id, e.target.value)} />
            )}
          </Box>
        ))}
      </Paper>
      {message && <Alert severity={message === 'Test submitted!' ? 'success' : 'error'}>{message}</Alert>}
      <Button variant="contained" color="primary" onClick={handleSubmit}>Submit Test</Button>
    </Box>
  );
}
