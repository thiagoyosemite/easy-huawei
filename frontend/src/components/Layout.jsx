import { Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PowerOffIcon from '@mui/icons-material/PowerOff';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import HelpIcon from '@mui/icons-material/Help';
import AllInboxIcon from '@mui/icons-material/AllInbox';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '@mui/material/styles';

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Todas as ONUs', icon: <AllInboxIcon />, path: '/all-onus' },
  { 
    text: 'ONUs Online', 
    icon: <FiberManualRecordIcon sx={{ color: '#4caf50' }} />, 
    path: '/online-onus' 
  },
  { 
    text: 'Sinal Alto', 
    icon: <WarningAmberIcon sx={{ color: '#ff9800' }} />, 
    path: '/high-signal-onus' 
  },
  { 
    text: 'ONUs Desligadas', 
    icon: <PowerOffIcon sx={{ color: '#9e9e9e' }} />, 
    path: '/offline-onus' 
  },
  { 
    text: 'ONUs com Falha', 
    icon: <LinkOffIcon sx={{ color: '#f44336' }} />, 
    path: '/failed-onus' 
  },
  { 
    text: 'Não Autorizadas', 
    icon: <HelpIcon sx={{ color: '#2196f3' }} />, 
    path: '/unauthorized-onus' 
  },
];

function Layout({ children, toggleTheme }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => handleMenuItemClick(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Easy Huawei
          </Typography>
          <IconButton 
            sx={{ ml: 1 }} 
            onClick={toggleTheme} 
            color="inherit"
            aria-label="toggle dark mode"
          >
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        {drawer}
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          mt: '64px' // altura da AppBar
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default Layout; 