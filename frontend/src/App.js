import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Register from './components/Register';
import Login from './components/Login';
import VerifyEmail from './components/VerifyEmail';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import QuestionBank from './components/QuestionBank';
import TestList from './components/TestList';
import TestCreate from './components/TestCreate';
import TestAssign from './components/TestAssign';
import TestDetail from './components/TestDetail';
import TestAttempt from './components/TestAttempt';
import TestResults from './components/TestResults';
import TestAnalytics from './components/TestAnalytics';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Set up axios base URL (no CORS/security settings)
axios.defaults.baseURL = 'http://127.0.0.1:5000/';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#ff4081', // Pink
    },
    secondary: {
      main: '#7c4dff', // Purple
    },
    background: {
      default: '#f3e5f5', // Light purple
      paper: '#fff8e1', // Light yellow
    },
    success: {
      main: '#00e676', // Green
    },
    error: {
      main: '#ff1744', // Red
    },
    info: {
      main: '#2979ff', // Blue
    },
    warning: {
      main: '#ffc400', // Yellow
    },
  },
  typography: {
    fontFamily: 'Comic Sans MS, Comic Sans, cursive',
    h5: {
      fontWeight: 700,
      color: '#7c4dff',
      letterSpacing: 2,
    },
    h4: {
      fontWeight: 900,
      color: '#ff4081',
      letterSpacing: 3,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 30,
          fontWeight: 700,
          textTransform: 'uppercase',
          boxShadow: '0 4px 20px 0 rgba(255,64,129,0.2)',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 8px 40px 0 rgba(124,77,255,0.15)',
          background: 'linear-gradient(135deg, #fff8e1 0%, #f3e5f5 100%)',
        },
      },
    },
  },
});

function App() {
  const [page, setPage] = useState('dashboard');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #7C4DFF 0%, #00E676 100%)' }}>
          <Sidebar setPage={setPage} page={page} />
          <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/question-bank" element={<QuestionBank />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/tests" element={<TestList />} />
              <Route path="/tests/create" element={<TestCreate />} />
              <Route path="/tests/:testId" element={<TestDetail />} />
              <Route path="/tests/:testId/assign" element={<TestAssign />} />
              <Route path="/tests/:testId/attempt" element={<TestAttempt />} />
              <Route path="/tests/:testId/results" element={<TestResults />} />
              <Route path="/tests/:testId/analytics" element={<TestAnalytics />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
