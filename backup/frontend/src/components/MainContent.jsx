import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import RouterIcon from '@mui/icons-material/Router';
import SettingsIcon from '@mui/icons-material/Settings';
import MonitorIcon from '@mui/icons-material/Monitor';
import WarningIcon from '@mui/icons-material/Warning';
import Dashboard from './Dashboard';
import ONUs from './ONUs';
import OnlineONUs from './OnlineONUs';
import OfflineONUs from './OfflineONUs';
import HighSignalONUs from './HighSignalONUs';
import AllONUs from './AllONUs';
import UnauthorizedONUs from './UnauthorizedONUs';
import ONUDetails from './ONUDetails';
import ProvisionONU from './ProvisionONU';
import Alerts from './Alerts';

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'ONUs', icon: <RouterIcon />, path: '/onus' },
  { text: 'ONUs não Autorizadas', icon: <WarningIcon />, path: '/unauthorized-onus' },
  { text: 'Monitoramento', icon: <MonitorIcon />, path: '/monitoring' },
  { text: 'Configurações', icon: <SettingsIcon />, path: '/settings' },
];

function MainContent({ toggleTheme }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Easy Huawei OLT Manager
          </Typography>
          <Alerts />
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
        >
          <List>
            {menuItems.map((item) => (
              <ListItem 
                button 
                key={item.text}
                onClick={() => handleMenuItemClick(item.path)}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          backgroundColor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/onus" element={<ONUs />} />
          <Route path="/unauthorized-onus" element={<UnauthorizedONUs />} />
          <Route path="/online-onus" element={<OnlineONUs />} />
          <Route path="/offline-onus" element={<OfflineONUs />} />
          <Route path="/high-signal-onus" element={<HighSignalONUs />} />
          <Route path="/all-onus" element={<AllONUs />} />
          <Route path="/monitoring" element={
            <Typography>Monitoramento será implementado em breve.</Typography>
          } />
          <Route path="/settings" element={
            <Typography>Configurações serão implementadas em breve.</Typography>
          } />
          <Route path="/onus/:serial" element={<ONUDetails />} />
          <Route path="/provision/:serial" element={<ProvisionONU />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default MainContent; 