import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

axios.defaults.baseURL = 'http://127.0.0.1:5000/';

const drawerWidth = 220;

export default function Sidebar() {
  const navigate = useNavigate();
  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Question Bank', icon: <LibraryBooksIcon />, path: '/question-bank' },
    { text: 'Profile', icon: <AssignmentIcon />, path: '/profile' },
    { text: 'Tests', icon: <AssignmentIcon />, path: '/tests' },
    { text: 'Analytics', icon: <BarChartIcon />, path: '/analytics' },
    { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
  ];
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', background: 'linear-gradient(135deg, #fff8e1 0%, #f3e5f5 100%)' },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {navItems.map((item) => (
            <ListItem button key={item.text} onClick={() => navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}
