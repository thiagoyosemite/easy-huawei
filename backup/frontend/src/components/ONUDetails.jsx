import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Grid,
  Paper,
  Typography,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { onuService } from '../services/onuService';

function ONUDetails() {
  const { serial } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onuDetails, setOnuDetails] = useState(null);
  const [trafficData, setTrafficData] = useState([]);
  const [signalHistory, setSignalHistory] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [history, setHistory] = useState([]);
  const [operationLoading, setOperationLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    fetchONUDetails();
    const interval = setInterval(fetchONUDetails, 30000);
    return () => clearInterval(interval);
  }, [serial]);

  const fetchONUDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await onuService.getONUDetails(serial);
      setOnuDetails(data);
      const [traffic, signal, history] = await Promise.all([
        onuService.getTrafficData(serial),
        onuService.getSignalHistory(serial),
        onuService.getHistory(serial)
      ]);
      
      setTrafficData(traffic);
      setSignalHistory(signal);
      setHistory(history);
    } catch (err) {
      setError('Erro ao carregar detalhes da ONU');
      console.error('Erro ao buscar detalhes da ONU:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    try {
      await onuService.performAction(serial, action);
      fetchONUDetails();
    } catch (err) {
      console.error(`Erro ao executar ação ${action}:`, err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return '#4caf50';
      case 'offline':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  const handleRebootONU = async () => {
    try {
      setOperationLoading(true);
      await onuService.rebootONU(serial);
      setSnackbar({
        open: true,
        message: 'ONU reiniciada com sucesso',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erro ao reiniciar ONU',
        severity: 'error'
      });
      console.error('Erro ao reiniciar ONU:', err);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleConfigurePorts = async () => {
    try {
      setOperationLoading(true);
      await onuService.configurePorts(serial);
      setSnackbar({
        open: true,
        message: 'Portas configuradas com sucesso',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erro ao configurar portas',
        severity: 'error'
      });
      console.error('Erro ao configurar portas:', err);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              {onuDetails?.name || 'ONU sem nome'}
            </Typography>
            <Typography color="textSecondary" gutterBottom>
              Serial: {serial}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <ButtonGroup variant="contained">
                <Button
                  startIcon={<PlayArrowIcon />}
                  onClick={() => handleAction('start')}
                >
                  Start
                </Button>
                <Button
                  startIcon={<StopIcon />}
                  onClick={() => handleAction('stop')}
                >
                  Stop
                </Button>
                <Button
                  startIcon={<RestartAltIcon />}
                  onClick={handleRebootONU}
                  disabled={operationLoading}
                >
                  Reboot
                </Button>
                <Button
                  startIcon={<SettingsIcon />}
                  onClick={handleConfigurePorts}
                  disabled={operationLoading}
                >
                  Configurar
                </Button>
              </ButtonGroup>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <List>
              <ListItem>
                <ListItemText
                  primary="Status"
                  secondary={
                    <Typography
                      component="span"
                      sx={{ color: getStatusColor(onuDetails?.status) }}
                    >
                      {onuDetails?.status?.toUpperCase() || 'Desconhecido'}
                    </Typography>
                  }
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Sinal"
                  secondary={`${onuDetails?.signal || 'N/A'} dBm`}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Última Atualização"
                  secondary={
                    onuDetails?.lastSeen
                      ? format(new Date(onuDetails.lastSeen), "dd/MM/yyyy 'às' HH:mm:ss", {
                          locale: ptBR,
                        })
                      : 'N/A'
                  }
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Detalhes" />
          <Tab label="Histórico" />
          <Tab label="Tráfego" />
        </Tabs>

        {selectedTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Informações do Hardware
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="Modelo" secondary={onuDetails?.model || 'N/A'} />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Versão do Hardware"
                    secondary={onuDetails?.hwVersion || 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Versão do Software"
                    secondary={onuDetails?.swVersion || 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Temperatura"
                    secondary={onuDetails?.temperature || 'N/A'}
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Configurações
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Perfil de Linha"
                    secondary={onuDetails?.configuration?.lineProfile || 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Perfil de Serviço"
                    secondary={onuDetails?.configuration?.srvProfile || 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="VLAN Nativa"
                    secondary={onuDetails?.configuration?.nativeVlan || 'N/A'}
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        )}

        {selectedTab === 1 && (
          <Timeline>
            {history.map((event, index) => (
              <TimelineItem key={index}>
                <TimelineSeparator>
                  <TimelineDot />
                  {index < history.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="h6" component="span">
                    {event.action}
                  </Typography>
                  <Typography color="textSecondary">
                    {format(new Date(event.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", {
                      locale: ptBR,
                    })}
                  </Typography>
                  {event.details && (
                    <Typography>{event.details}</Typography>
                  )}
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}

        {selectedTab === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Informações de Tráfego
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Upload
                </Typography>
                <Typography>
                  {onuDetails?.bandwidth?.upstream || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Download
                </Typography>
                <Typography>
                  {onuDetails?.bandwidth?.downstream || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ONUDetails; 