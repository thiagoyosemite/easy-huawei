import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Link,
  ButtonGroup,
  IconButton,
  Collapse,
  TextField as MonacoEditor,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ErrorOutline as ErrorOutlineIcon,
  SignalCellular4Bar as SignalIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon
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

const headCells = [
  { id: 'status', label: 'Status', width: '100px' },
  { id: 'serial', label: 'Serial' },
  { id: 'description', label: 'Descrição' },
  { id: 'port', label: 'Porta' },
  { id: 'lastSeen', label: 'Última Detecção' }
];

const FailedONUs = () => {
  const [onus, setOnus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState('serial');
  const [order, setOrder] = useState('asc');
  const [selectedONU, setSelectedONU] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('info');
  const [trafficData, setTrafficData] = useState([]);
  const [signalData, setSignalData] = useState([]);
  const [configData, setConfigData] = useState('');
  const [swInfo, setSwInfo] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedPort, setSelectedPort] = useState(null);
  const [portConfig, setPortConfig] = useState({
    adminState: 'enabled',
    mode: 'lan',
    vlan: '',
    board: '',
    port: '',
    dhcpMode: 'none'
  });
  const [configErrors, setConfigErrors] = useState({});
  const [portAutoConfig, setPortAutoConfig] = useState(null);

  useEffect(() => {
    const fetchONUs = async () => {
      try {
        const response = await api.get('/onus');
        const failedONUs = response.data.filter(onu => 
          onu.status === 'offline' && onu.lastEvent === 'los'
        );
        setOnus(failedONUs);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchONUs();
    // Atualiza a cada 30 segundos
    const interval = setInterval(fetchONUs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedONU) {
      // Simular dados de tráfego (será substituído pela API real)
      const now = new Date();
      const trafficPoints = Array.from({ length: 24 }, (_, i) => {
        const time = new Date(now.getTime() - (23 - i) * 3600000);
        return {
          time: time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          upload: Math.random() * 100,
          download: Math.random() * 1000
        };
      });
      setTrafficData(trafficPoints);

      // Simular dados de sinal (será substituído pela API real)
      const signalPoints = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now.getTime() - (6 - i) * 86400000);
        return {
          date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          signal: -25 - Math.random() * 0.5
        };
      });
      setSignalData(signalPoints);
    }
  }, [selectedONU]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleStatusClick = (onu) => {
    setSelectedONU(onu);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedONU(null);
  };

  const sortedONUs = React.useMemo(() => {
    const comparator = (a, b) => {
      if (order === 'desc') {
        [a, b] = [b, a];
      }
      return a[orderBy] < b[orderBy] ? -1 : a[orderBy] > b[orderBy] ? 1 : 0;
    };

    return [...onus].sort(comparator);
  }, [onus, order, orderBy]);

  const filteredONUs = sortedONUs.filter(onu =>
    Object.values(onu).some(value =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleTabChange = async (tab) => {
    setSelectedTab(tab);
    setLoadingAction(true);

    try {
      switch (tab) {
        case 'config':
          const configResponse = await api.get(`/onus/${selectedONU.serial}/config`);
          setConfigData(configResponse.data.config);
          break;
        case 'sw':
          const swResponse = await api.get(`/onus/${selectedONU.serial}/software`);
          setSwInfo(swResponse.data);
          break;
        default:
          // 'info' tab uses existing data
          break;
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(configData);
  };

  const handleDownloadConfig = () => {
    const blob = new Blob([configData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `config-${selectedONU.serial}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleConfigurePort = async (port) => {
    setSelectedPort(port);
    setConfigErrors({});
    setConfigDialogOpen(true);

    try {
      // Busca configuração automática da porta onde a ONU foi detectada
      const response = await api.get(`/onus/${selectedONU.serial}/auto-config`);
      const autoConfig = response.data;
      
      setPortAutoConfig(autoConfig);
      setPortConfig({
        adminState: 'enabled',
        mode: autoConfig.mode || 'lan',
        vlan: autoConfig.vlan || '',
        board: autoConfig.board || '',
        port: autoConfig.port || '',
        dhcpMode: autoConfig.dhcpMode || 'none'
      });
    } catch (err) {
      console.error('Erro ao buscar configuração automática:', err);
      // Em caso de erro, inicializa com valores padrão
      setPortConfig({
        adminState: 'enabled',
        mode: 'lan',
        vlan: '',
        board: '',
        port: '',
        dhcpMode: 'none'
      });
    }
  };

  const handleCloseConfigDialog = () => {
    setConfigDialogOpen(false);
    setSelectedPort(null);
    setPortConfig({
      adminState: 'enabled',
      mode: 'lan',
      vlan: '',
      board: '',
      port: '',
      dhcpMode: 'none'
    });
    setConfigErrors({});
  };

  const validatePortConfig = () => {
    const errors = {};
    
    if (!portConfig.vlan) {
      errors.vlan = 'VLAN é obrigatória';
    } else if (portConfig.vlan < 1 || portConfig.vlan > 4094) {
      errors.vlan = 'VLAN deve estar entre 1 e 4094';
    }

    if (!portConfig.board) {
      errors.board = 'Placa é obrigatória';
    }

    if (!portConfig.port) {
      errors.port = 'Porta é obrigatória';
    }

    return errors;
  };

  const handleSavePortConfig = async () => {
    const errors = validatePortConfig();
    if (Object.keys(errors).length > 0) {
      setConfigErrors(errors);
      return;
    }

    try {
      await api.post(`/onus/${selectedONU.serial}/ports/${selectedPort}/config`, portConfig);
      handleCloseConfigDialog();
      // Recarregar dados da ONU
      handleTabChange(selectedTab);
    } catch (err) {
      console.error('Erro ao configurar porta:', err);
      setConfigErrors({ submit: 'Erro ao salvar configuração: ' + err.message });
    }
  };

  const renderTabContent = () => {
    if (loadingAction) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      );
    }

    switch (selectedTab) {
      case 'config':
        return (
          <Box sx={{ position: 'relative' }}>
            <Box sx={{ position: 'absolute', right: 0, top: 0, zIndex: 1 }}>
              <IconButton onClick={handleCopyConfig} title="Copiar configuração">
                <CopyIcon />
              </IconButton>
              <IconButton onClick={handleDownloadConfig} title="Download configuração">
                <DownloadIcon />
              </IconButton>
            </Box>
            <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: '#f5f5f5' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                {configData || 'Nenhuma configuração disponível'}
              </pre>
            </Paper>
          </Box>
        );
      
      case 'sw':
        return swInfo ? (
          <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Versão do Software
                </Typography>
                <Typography>{swInfo.version}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Build
                </Typography>
                <Typography>{swInfo.build}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Última Atualização
                </Typography>
                <Typography>
                  {new Date(swInfo.lastUpdate).toLocaleString('pt-BR')}
                </Typography>
              </Grid>
              {swInfo.changelog && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Changelog
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 1, mt: 1, bgcolor: '#f5f5f5' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {swInfo.changelog}
                    </pre>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Paper>
        ) : (
          <Typography color="textSecondary" sx={{ mt: 2 }}>
            Informações de software não disponíveis
          </Typography>
        );

      default:
        return (
          <Grid container spacing={2}>
            {/* Existing info content */}

            {/* Seção de Portas Ethernet */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Ethernet ports
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Port</TableCell>
                      <TableCell>Admin state</TableCell>
                      <TableCell>Mode</TableCell>
                      <TableCell>VLAN</TableCell>
                      <TableCell>Board/Port</TableCell>
                      <TableCell>DHCP</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {['eth_0/1', 'eth_0/2', 'eth_0/3'].map((port) => (
                      <TableRow key={port}>
                        <TableCell>{port}</TableCell>
                        <TableCell>Enabled</TableCell>
                        <TableCell>LAN</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>No control</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleConfigurePort(port)}
                          >
                            Configure
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        );
    }
  };

  const renderPortConfigDialog = () => (
    <Dialog
      open={configDialogOpen}
      onClose={handleCloseConfigDialog}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Configurar Porta {selectedPort}
        {portAutoConfig && (
          <Typography variant="subtitle2" color="success.main" sx={{ mt: 1 }}>
            Configuração detectada automaticamente da OLT
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={portConfig.adminState === 'enabled'}
                  onChange={(e) => setPortConfig({
                    ...portConfig,
                    adminState: e.target.checked ? 'enabled' : 'disabled'
                  })}
                />
              }
              label="Porta Habilitada"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!configErrors.board}>
              <InputLabel>Placa</InputLabel>
              <Select
                value={portConfig.board}
                label="Placa"
                onChange={(e) => setPortConfig({
                  ...portConfig,
                  board: e.target.value
                })}
              >
                {Array.from({ length: 16 }, (_, i) => (
                  <MenuItem key={i} value={i}>{i}</MenuItem>
                ))}
              </Select>
              {configErrors.board && (
                <FormHelperText>{configErrors.board}</FormHelperText>
              )}
              {portAutoConfig?.board && (
                <FormHelperText sx={{ color: 'success.main' }}>
                  Detectado na placa {portAutoConfig.board}
                </FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!configErrors.port}>
              <InputLabel>Porta</InputLabel>
              <Select
                value={portConfig.port}
                label="Porta"
                onChange={(e) => setPortConfig({
                  ...portConfig,
                  port: e.target.value
                })}
              >
                {Array.from({ length: 16 }, (_, i) => (
                  <MenuItem key={i} value={i}>{i}</MenuItem>
                ))}
              </Select>
              {configErrors.port && (
                <FormHelperText>{configErrors.port}</FormHelperText>
              )}
              {portAutoConfig?.port && (
                <FormHelperText sx={{ color: 'success.main' }}>
                  Detectado na porta {portAutoConfig.port}
                </FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Modo</InputLabel>
              <Select
                value={portConfig.mode}
                label="Modo"
                onChange={(e) => setPortConfig({
                  ...portConfig,
                  mode: e.target.value
                })}
              >
                <MenuItem value="lan">LAN</MenuItem>
                <MenuItem value="wan">WAN</MenuItem>
                <MenuItem value="hybrid">Hybrid</MenuItem>
              </Select>
              {portAutoConfig?.mode && (
                <FormHelperText sx={{ color: 'success.main' }}>
                  Modo sugerido com base na configuração da porta
                </FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="VLAN"
              type="number"
              value={portConfig.vlan}
              onChange={(e) => setPortConfig({
                ...portConfig,
                vlan: e.target.value
              })}
              error={!!configErrors.vlan}
              helperText={
                configErrors.vlan || 
                (portAutoConfig?.vlan && 'VLAN detectada da porta da OLT')
              }
              FormHelperTextProps={{
                sx: portAutoConfig?.vlan ? { color: 'success.main' } : {}
              }}
              inputProps={{
                min: 1,
                max: 4094
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Modo DHCP</InputLabel>
              <Select
                value={portConfig.dhcpMode}
                label="Modo DHCP"
                onChange={(e) => setPortConfig({
                  ...portConfig,
                  dhcpMode: e.target.value
                })}
              >
                <MenuItem value="none">Sem controle</MenuItem>
                <MenuItem value="server">Servidor DHCP</MenuItem>
                <MenuItem value="relay">DHCP Relay</MenuItem>
              </Select>
              {portAutoConfig?.dhcpMode && (
                <FormHelperText sx={{ color: 'success.main' }}>
                  Configuração DHCP sugerida com base na porta
                </FormHelperText>
              )}
            </FormControl>
          </Grid>

          {configErrors.submit && (
            <Grid item xs={12}>
              <Alert severity="error">
                {configErrors.submit}
              </Alert>
            </Grid>
          )}

          {portAutoConfig && (
            <Grid item xs={12}>
              <Alert severity="info">
                As configurações foram preenchidas automaticamente com base na porta {portAutoConfig.board}/{portAutoConfig.port} onde a ONU foi detectada.
                Você pode modificar estes valores se necessário.
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseConfigDialog}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSavePortConfig}
          variant="contained"
          color="primary"
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Erro ao carregar ONUs com falha física: {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        ONUs com Falha Física
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Buscar ONU..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell 
                  key={headCell.id}
                  style={{ width: headCell.width }}
                >
                  <TableSortLabel
                    active={orderBy === headCell.id}
                    direction={orderBy === headCell.id ? order : 'asc'}
                    onClick={() => handleRequestSort(headCell.id)}
                  >
                    {headCell.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredONUs.map((onu) => (
              <TableRow key={onu.serial} hover>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => handleStatusClick(onu)}
                  >
                    Status
                  </Button>
                </TableCell>
                <TableCell>{onu.serial}</TableCell>
                <TableCell>{onu.description}</TableCell>
                <TableCell>{onu.port}</TableCell>
                <TableCell>
                  {new Date(onu.lastSeen).toLocaleString('pt-BR')}
                </TableCell>
              </TableRow>
            ))}
            {filteredONUs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Nenhuma ONU com falha física encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        {selectedONU && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Grid container alignItems="center" spacing={2}>
                <Grid item>
                  <Typography variant="h6">
                    {selectedONU.description || 'ONU sem descrição'}
                  </Typography>
                </Grid>
                <Grid item>
                  <Chip
                    icon={<ErrorOutlineIcon />}
                    label="LOS"
                    color="error"
                    variant="outlined"
                    size="small"
                  />
                </Grid>
              </Grid>
            </DialogTitle>
            <DialogContent>
              <ButtonGroup sx={{ mb: 3 }}>
                <Button
                  variant={selectedTab === 'info' ? 'contained' : 'outlined'}
                  onClick={() => handleTabChange('info')}
                >
                  Get status
                </Button>
                <Button
                  variant={selectedTab === 'config' ? 'contained' : 'outlined'}
                  onClick={() => handleTabChange('config')}
                >
                  Show running-config
                </Button>
                <Button
                  variant={selectedTab === 'sw' ? 'contained' : 'outlined'}
                  onClick={() => handleTabChange('sw')}
                >
                  SW info
                </Button>
                <Button
                  color="success"
                  variant="contained"
                  onClick={() => window.open(`/live/${selectedONU.serial}`, '_blank')}
                >
                  LIVE!
                </Button>
              </ButtonGroup>

              {renderTabContent()}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>
                Fechar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      {renderPortConfigDialog()}
    </Box>
  );
};

export default FailedONUs;