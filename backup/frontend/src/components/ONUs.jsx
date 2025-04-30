import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Typography,
  Tabs,
  Tab,
  Grid,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  ButtonGroup
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SignalCellular4Bar as SignalIcon,
  Info as InfoIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Router as RouterIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  Storage as StorageIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Build as BuildIcon
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
import api from '../api';
import ONUHistory from './ONUHistory';
import { useNavigate } from 'react-router-dom';

function ONUs() {
  const [onus, setOnus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOnu, setSelectedOnu] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [trafficData, setTrafficData] = useState([]);
  const [signalHistory, setSignalHistory] = useState([]);
  const [onuDetails, setOnuDetails] = useState(null);
  const [filters, setFilters] = useState({
    olt: 'Any',
    board: 'Any',
    port: 'Any',
    zone: 'Any',
    odb: 'Any',
    vlan: 'Any',
    onuType: 'Any',
    profile: 'Any',
    status: 'Any',
    signal: 'Any'
  });
  const navigate = useNavigate();

  // Opções para os filtros
  const filterOptions = {
    olt: ['Any', 'OLT-Huawei'],
    board: ['Any', '0', '1', '2', '3', '4', '5', '6', '7'],
    port: ['Any', '0', '1', '2', '3', '4', '5', '6', '7', '8'],
    zone: ['Any', 'Zone 1', 'Zone 2', 'Zone 3'],
    odb: ['Any', 'None', 'ODB-1', 'ODB-2'],
    vlan: ['Any', '100', '200', '300', '400'],
    onuType: ['Any', 'Router_Huawei', 'Bridge_Huawei'],
    profile: ['Any', 'Default', 'Premium', 'Business'],
    status: ['Any', 'Online', 'Offline', 'LoS'],
    signal: ['Any', 'Excellent', 'Good', 'Poor']
  };

  useEffect(() => {
    fetchONUs();
    const interval = setInterval(fetchONUs, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchONUs = async () => {
    try {
      setError(null);
      const response = await api.get('/onus');
      setOnus(response.data);
    } catch (err) {
      setError('Erro ao carregar ONUs');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleFilterChange = (filterName) => (event) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: event.target.value
    }));
  };

  const handleOpenDetails = async (onu) => {
    setSelectedOnu(onu);
    setDetailsOpen(true);
    try {
      // Buscar detalhes adicionais da ONU
      const detailsResponse = await api.get(`/onus/${onu.serial}/details`);
      setOnuDetails(detailsResponse.data);

      // Buscar histórico de tráfego
      const trafficResponse = await api.get(`/onus/${onu.serial}/traffic`);
      setTrafficData(trafficResponse.data);

      // Buscar histórico de sinal
      const signalResponse = await api.get(`/onus/${onu.serial}/signal-history`);
      setSignalHistory(signalResponse.data);
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
    }
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedOnu(null);
    setSelectedTab(0);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleViewONU = (onu) => {
    navigate(`/onus/${onu.serial}`, { state: { onu } });
  };

  const renderFilters = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por SN, IP, nome, endereço..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      <Grid item xs={12} md={2}>
        <FormControl fullWidth>
          <InputLabel>OLT</InputLabel>
          <Select
            value={filters.olt}
            onChange={handleFilterChange('olt')}
            label="OLT"
          >
            {filterOptions.olt.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={2}>
        <FormControl fullWidth>
          <InputLabel>Board</InputLabel>
          <Select
            value={filters.board}
            onChange={handleFilterChange('board')}
            label="Board"
          >
            {filterOptions.board.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={2}>
        <FormControl fullWidth>
          <InputLabel>Port</InputLabel>
          <Select
            value={filters.port}
            onChange={handleFilterChange('port')}
            label="Port"
          >
            {filterOptions.port.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={2}>
        <FormControl fullWidth>
          <InputLabel>Zone</InputLabel>
          <Select
            value={filters.zone}
            onChange={handleFilterChange('zone')}
            label="Zone"
          >
            {filterOptions.zone.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={2}>
        <FormControl fullWidth>
          <InputLabel>ODB</InputLabel>
          <Select
            value={filters.odb}
            onChange={handleFilterChange('odb')}
            label="ODB"
          >
            {filterOptions.odb.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={2}>
        <FormControl fullWidth>
          <InputLabel>VLAN</InputLabel>
          <Select
            value={filters.vlan}
            onChange={handleFilterChange('vlan')}
            label="VLAN"
          >
            {filterOptions.vlan.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <Stack direction="row" spacing={2}>
          <ButtonGroup variant="outlined" size="small">
            <Button
              startIcon={<PlayArrowIcon />}
              onClick={() => console.log('Start ONU')}
            >
              Start
            </Button>
            <Button
              startIcon={<StopIcon />}
              onClick={() => console.log('Stop ONU')}
            >
              Stop
            </Button>
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => console.log('Reboot ONU')}
            >
              Reboot
            </Button>
          </ButtonGroup>
          <ButtonGroup variant="outlined" size="small">
            <Button
              startIcon={<BuildIcon />}
              onClick={() => console.log('Configure ONU')}
            >
              Configure
            </Button>
            <Button
              startIcon={<InfoIcon />}
              onClick={() => console.log('Get Status')}
            >
              Get Status
            </Button>
          </ButtonGroup>
        </Stack>
      </Grid>
    </Grid>
  );

  const renderDetailsContent = () => {
    if (!selectedOnu || !onuDetails) return null;

    switch (selectedTab) {
      case 0: // Informações Gerais
        return (
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
                        primary="Serial" 
                        secondary={selectedOnu.serial} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><MemoryIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Modelo" 
                        secondary={onuDetails.model || 'N/A'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><StorageIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Versão de Hardware" 
                        secondary={onuDetails.hwVersion || 'N/A'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><SettingsIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Versão de Software" 
                        secondary={onuDetails.swVersion || 'N/A'} 
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
                        primary="Potência do Sinal" 
                        secondary={`${onuDetails.signal || 'N/A'} dBm`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><SpeedIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Temperatura" 
                        secondary={`${onuDetails.temperature || 'N/A'}°C`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><TimelineIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Uptime" 
                        secondary={onuDetails.uptime || 'N/A'}
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
          </Grid>
        );

      case 1: // Tráfego
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Histórico de Tráfego
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
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
        );

      case 2: // Configurações
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Configurações da ONU
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="Profile de Linha" 
                        secondary={onuDetails.lineProfile || 'N/A'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Profile de Serviço" 
                        secondary={onuDetails.serviceProfile || 'N/A'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="VLAN Nativa" 
                        secondary={onuDetails.nativeVlan || 'N/A'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Modo de Operação" 
                        secondary={onuDetails.operationMode || 'N/A'} 
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
                    Portas Ethernet
                  </Typography>
                  <TableContainer>
                    <Table size="small">
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
                        {onuDetails.ports?.map((port, index) => (
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
                              <IconButton size="small" onClick={() => console.log('Configure port')}>
                                <SettingsIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 3: // Histórico
        return <ONUHistory serial={selectedOnu?.serial} />;

      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'online':
        return 'success';
      case 'offline':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSignalQuality = (signal) => {
    if (signal >= -15) return 'Excelente';
    if (signal >= -20) return 'Muito Bom';
    if (signal >= -25) return 'Bom';
    if (signal >= -30) return 'Regular';
    return 'Ruim';
  };

  const getSignalColor = (signal) => {
    if (signal >= -15) return 'success';
    if (signal >= -20) return 'success';
    if (signal >= -25) return 'warning';
    if (signal >= -30) return 'warning';
    return 'error';
  };

  const filteredOnus = onus.filter((onu) =>
    Object.values(onu).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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
      {renderFilters()}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Serial</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Sinal</TableCell>
              <TableCell>Porta</TableCell>
              <TableCell>Última Detecção</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOnus
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((onu) => (
                <TableRow key={onu.serial}>
                  <TableCell>{onu.serial}</TableCell>
                  <TableCell>
                    <Chip 
                      label={onu.status} 
                      color={getStatusColor(onu.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <SignalIcon sx={{ color: getSignalColor(onu.signal), mr: 1 }} />
                      {onu.signal} dBm
                    </Box>
                  </TableCell>
                  <TableCell>{onu.port}</TableCell>
                  <TableCell>{new Date(onu.lastSeen).toLocaleString()}</TableCell>
                  <TableCell align="center">
                    <ButtonGroup size="small">
                      <Button
                        startIcon={<InfoIcon />}
                        onClick={() => handleViewONU(onu)}
                        sx={{ 
                          color: '#1976d2',
                          '&:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.08)'
                          }
                        }}
                      >
                        Visualizar
                      </Button>
                    </ButtonGroup>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 100]}
        component="div"
        count={onus.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Detalhes da ONU
          {selectedOnu && (
            <Typography variant="subtitle1" color="textSecondary">
              Serial: {selectedOnu.serial}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={selectedTab} onChange={handleTabChange}>
              <Tab label="Informações" />
              <Tab label="Tráfego" />
              <Tab label="Configurações" />
              <Tab label="Histórico" />
            </Tabs>
          </Box>
          {renderDetailsContent()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ONUs; 