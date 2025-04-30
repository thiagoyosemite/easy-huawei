import { useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter as Router } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import MainContent from './components/MainContent';

function App() {
  const [mode, setMode] = useState('light');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#1976d2',
          },
          background: {
            default: mode === 'light' ? '#f5f5f5' : '#121212',
          },
        },
      }),
    [mode],
  );

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MainContent toggleTheme={toggleTheme} />
      </ThemeProvider>
    </Router>
  );
}

export default App;
