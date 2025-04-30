import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Button,
  ButtonGroup,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Snackbar
} from '@mui/material';
import {
  SignalCellular4Bar as SignalIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Router as RouterIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  Storage as StorageIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
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

  const handleTestConnectivity = async () => {
    try {
      setOperationLoading(true);
      await onuService.testConnectivity(serial);
      setSnackbar({
        open: true,
        message: 'Teste de conectividade realizado com sucesso',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erro ao testar conectividade: ' + (err.response?.data?.message || err.message),
        severity: 'error'
      });
    } finally {
      setOperationLoading(false);
    }
  };

  const handleCheckPortStatus = async () => {
    try {
      setOperationLoading(true);
      await onuService.getONUStatus(serial);
      setSnackbar({
        open: true,
        message: 'Status das portas verificado com sucesso',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erro ao verificar status das portas: ' + (err.response?.data?.message || err.message),
        severity: 'error'
      });
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
                  startIcon={<RefreshIcon />}
                  onClick={() => handleAction('reboot')}
                >
                  Reboot
                </Button>
              </ButtonGroup>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" justifyContent="flex-end" alignItems="center">
              <Chip
                label={onuDetails?.status}
                color={getStatusColor(onuDetails?.status)}
                sx={{ mr: 1 }}
              />
              <Button
                variant="contained"
                color="success"
                onClick={() => window.open(`/live/${serial}`, '_blank')}
              >
                LIVE!
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informações Básicas
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><RouterIcon /></ListItemIcon>
                  <ListItemText 
                    primary="OLT/Board/Port" 
                    secondary={`${onuDetails?.olt || 'N/A'} / ${onuDetails?.board || 'N/A'} / ${onuDetails?.port || 'N/A'}`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><MemoryIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Modelo" 
                    secondary={onuDetails?.model || 'N/A'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><StorageIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Versão de Hardware" 
                    secondary={onuDetails?.hwVersion || 'N/A'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><SettingsIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Versão de Software" 
                    secondary={onuDetails?.swVersion || 'N/A'} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status Operacional
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><SignalIcon /></ListItemIcon>
                  <ListItemText 
                    primary="ONU/OLT Rx signal" 
                    secondary={`${onuDetails?.signal || 'N/A'} dBm / ${onuDetails?.oltSignal || 'N/A'} dBm`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><SpeedIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Temperatura" 
                    secondary={`${onuDetails?.temperature || 'N/A'}°C`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TimelineIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Uptime" 
                    secondary={onuDetails?.uptime || 'N/A'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tráfego Diário
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="download" 
                    stroke="#82ca9d" 
                    name="Download (Mbps)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="upload" 
                    stroke="#8884d8" 
                    name="Upload (Mbps)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Histórico de Sinal
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={signalHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="signal" 
                    stroke="#8884d8" 
                    name="Potência (dBm)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Portas Ethernet
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Porta</TableCell>
                      <TableCell>Estado Admin</TableCell>
                      <TableCell>Modo</TableCell>
                      <TableCell>DHCP</TableCell>
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {onuDetails?.ports?.map((port, index) => (
                      <TableRow key={index}>
                        <TableCell>{port.name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={port.adminState} 
                            color={port.adminState === 'Enabled' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{port.mode}</TableCell>
                        <TableCell>{port.dhcp}</TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => console.log('Configure port')}
                          >
                            Configure
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Tabs value={selectedTab} onChange={handleTabChange}>
                <Tab label="Histórico" />
                <Tab label="Configurações" />
                <Tab label="Diagnóstico" />
              </Tabs>

              {/* Histórico */}
              {selectedTab === 0 && (
                <Box mt={2}>
                  <Timeline>
                    {history.map((event, index) => (
                      <TimelineItem key={index}>
                        <TimelineSeparator>
                          <TimelineDot color={event.type === 'error' ? 'error' : 'primary'} />
                          {index < history.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent>
                          <Typography variant="subtitle2">
                            {format(new Date(event.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                          </Typography>
                          <Typography>{event.description}</Typography>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                </Box>
              )}

              {/* Configurações */}
              {selectedTab === 1 && (
                <Box mt={2}>
                  <Typography variant="subtitle1" gutterBottom>
                    Configurações da ONU
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={handleRebootONU}
                        disabled={operationLoading}
                      >
                        {operationLoading ? <CircularProgress size={24} /> : 'Reiniciar ONU'}
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Button
                        variant="contained"
                        color="secondary"
                        fullWidth
                        onClick={handleConfigurePorts}
                        disabled={operationLoading}
                      >
                        {operationLoading ? <CircularProgress size={24} /> : 'Configurar Portas'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Diagnóstico */}
              {selectedTab === 2 && (
                <Box mt={2}>
                  <Typography variant="subtitle1" gutterBottom>
                    Ferramentas de Diagnóstico
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Button
                        variant="outlined"
                        color="primary"
                        fullWidth
                        onClick={handleTestConnectivity}
                        disabled={operationLoading}
                      >
                        {operationLoading ? <CircularProgress size={24} /> : 'Testar Conectividade'}
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Button
                        variant="outlined"
                        color="secondary"
                        fullWidth
                        onClick={handleCheckPortStatus}
                        disabled={operationLoading}
                      >
                        {operationLoading ? <CircularProgress size={24} /> : 'Verificar Status das Portas'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ONUDetails; 