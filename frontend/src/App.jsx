import { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
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
import Dashboard from './components/Dashboard';
import ONUs from './components/ONUs';
import UnauthorizedONUs from './components/UnauthorizedONUs';

const darkTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Azul do Material UI
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff'
    },
    text: {
      primary: '#1976d2'
    }
  },
});

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, component: Dashboard },
  { text: 'ONUs', icon: <RouterIcon />, component: ONUs },
  { text: 'ONUs não Autorizadas', icon: <WarningIcon />, component: UnauthorizedONUs },
  { text: 'Monitoramento', icon: <MonitorIcon /> },
  { text: 'Configurações', icon: <SettingsIcon /> },
];

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedView, setSelectedView] = useState('Dashboard');

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleMenuItemClick = (text) => {
    setSelectedView(text);
    setDrawerOpen(false);
  };

  const renderContent = () => {
    const selectedItem = menuItems.find(item => item.text === selectedView);
    if (selectedItem?.component) {
      const Component = selectedItem.component;
      return <Component />;
    }
    return (
      <Typography>
        Conteúdo do {selectedView} será implementado em breve.
      </Typography>
    );
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
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
            <Typography variant="h6" noWrap component="div">
              Easy Huawei OLT Manager
            </Typography>
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
                  onClick={() => handleMenuItemClick(item.text)}
                  selected={selectedView === item.text}
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
          <Typography variant="h4" gutterBottom>
            {selectedView}
          </Typography>
          {renderContent()}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App; 