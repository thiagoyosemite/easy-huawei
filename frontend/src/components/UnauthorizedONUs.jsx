import React from 'react';
import { useState, useEffect, memo } from 'react';
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
  TableSortLabel,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Typography,
  Grid,
  Tooltip,
  Snackbar,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Info as InfoIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';
import api from '../api';

// Função de comparação para ordenação
function descendingComparator(a, b, orderBy) {
  if (orderBy === 'firstSeen') {
    return new Date(b[orderBy]) - new Date(a[orderBy]);
  }
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

const headCells = [
  { id: 'sn', label: 'Serial', tooltip: 'Número de série da ONU' },
  { id: 'port', label: 'Porta', tooltip: 'Porta onde a ONU foi detectada' },
  { id: 'firstSeen', label: 'Primeira Detecção', tooltip: 'Data e hora da primeira detecção' },
  { id: 'actions', label: 'Ações', tooltip: '', sortable: false }
];

const UnauthorizedONUs = memo(function UnauthorizedONUs() {
  const [onus, setOnus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOnu, setSelectedOnu] = useState(null);
  const [provisionDialogOpen, setProvisionDialogOpen] = useState(false);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('firstSeen');
  const [provisionData, setProvisionData] = useState({
    description: '',
    port: '',
  });
  const [provisioning, setProvisioning] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [validationErrors, setValidationErrors] = useState({
    description: '',
    port: ''
  });

  useEffect(() => {
    fetchUnauthorizedONUs();
    const interval = setInterval(fetchUnauthorizedONUs, 30000);

    // Adiciona handlers de teclado
    const handleKeyPress = (event) => {
      // Alt + F para focar na busca
      if (event.altKey && event.key === 'f') {
        event.preventDefault();
        document.getElementById('search-onus').focus();
      }
      
      // Esc para fechar o diálogo
      if (event.key === 'Escape' && provisionDialogOpen) {
        handleCloseProvisionDialog();
      }

      // Enter para confirmar o provisionamento
      if (event.key === 'Enter' && 
          provisionDialogOpen && 
          provisionData.description && 
          provisionData.port && 
          !provisioning && 
          !validationErrors.description && 
          !validationErrors.port) {
        handleProvision();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [provisionDialogOpen, provisionData, provisioning, validationErrors]);

  const fetchUnauthorizedONUs = async () => {
    try {
      setError(null);
      const response = await api.get('/unauthorized-onus');
      setOnus(response.data);
    } catch (err) {
      setError('Erro ao carregar ONUs não autorizadas');
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

  const handleOpenProvisionDialog = (onu) => {
    setSelectedOnu(onu);
    setProvisionDialogOpen(true);
  };

  const handleCloseProvisionDialog = () => {
    setProvisionDialogOpen(false);
    setSelectedOnu(null);
    setProvisionData({ description: '', port: '' });
  };

  const validatePort = (port) => {
    const portRegex = /^\d+\/\d+\/\d+$/;
    if (!port) return 'Porta é obrigatória';
    if (!portRegex.test(port)) return 'Formato inválido. Use: frame/slot/port (exemplo: 0/1/1)';
    return '';
  };

  const validateDescription = (description) => {
    if (!description) return 'Descrição é obrigatória';
    if (description.length < 3) return 'Descrição deve ter pelo menos 3 caracteres';
    if (description.length > 50) return 'Descrição deve ter no máximo 50 caracteres';
    return '';
  };

  const handleProvisionDataChange = (field) => (event) => {
    const value = event.target.value;
    setProvisionData(prev => ({
      ...prev,
      [field]: value
    }));

    // Validação em tempo real
    if (field === 'port') {
      setValidationErrors(prev => ({
        ...prev,
        port: validatePort(value)
      }));
    } else if (field === 'description') {
      setValidationErrors(prev => ({
        ...prev,
        description: validateDescription(value)
      }));
    }
  };

  const handleProvision = async () => {
    if (!selectedOnu) return;

    // Validação final antes de enviar
    const portError = validatePort(provisionData.port);
    const descriptionError = validateDescription(provisionData.description);

    if (portError || descriptionError) {
      setValidationErrors({
        port: portError,
        description: descriptionError
      });
      return;
    }

    try {
      setProvisioning(true);
      await api.post('/provision-onu', {
        serialNumber: selectedOnu.sn,
        port: provisionData.port,
        description: provisionData.description
      });
      
      setSnackbar({
        open: true,
        message: 'ONU provisionada com sucesso!',
        severity: 'success'
      });
      
      handleCloseProvisionDialog();
      fetchUnauthorizedONUs();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erro ao provisionar ONU: ' + (err.response?.data?.message || err.message),
        severity: 'error'
      });
      console.error('Erro:', err);
    } finally {
      setProvisioning(false);
    }
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const exportToCSV = () => {
    const headers = ['Serial', 'Porta', 'Primeira Detecção'];
    const csvData = onus.map(onu => [
      onu.sn,
      onu.port,
      new Date(onu.firstSeen).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'onus_nao_autorizadas.csv';
    link.click();
    
    setSnackbar({
      open: true,
      message: 'Dados exportados com sucesso!',
      severity: 'success'
    });
  };

  const filteredOnus = onus.filter((onu) =>
    Object.values(onu).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedAndFilteredOnus = filteredOnus
    .sort(getComparator(order, orderBy))
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Box flex={1} mr={2}>
          <Tooltip title="Digite o número de série ou porta para filtrar (Alt + F)">
            <TextField
              id="search-onus"
              fullWidth
              variant="outlined"
              placeholder="Buscar ONU..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              aria-label="Buscar ONUs não autorizadas"
            />
          </Tooltip>
        </Box>
        <Tooltip title="Exportar dados para CSV">
          <IconButton 
            onClick={exportToCSV}
            aria-label="Exportar dados"
            color="primary"
          >
            <FileDownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <TableContainer component={Paper}>
        <Table aria-label="Tabela de ONUs não autorizadas">
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  sortDirection={orderBy === headCell.id ? order : false}
                >
                  {headCell.sortable !== false ? (
                    <Tooltip title={headCell.tooltip}>
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={() => handleRequestSort(headCell.id)}
                      >
                        <Box display="flex" alignItems="center">
                          {headCell.label}
                          {orderBy === headCell.id ? (
                            <Box component="span" sx={visuallyHidden}>
                              {order === 'desc' ? 'ordenado decrescente' : 'ordenado crescente'}
                            </Box>
                          ) : null}
                        </Box>
                      </TableSortLabel>
                    </Tooltip>
                  ) : (
                    headCell.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedAndFilteredOnus.map((onu) => (
              <TableRow 
                key={onu.sn}
                hover
                tabIndex={-1}
                role="checkbox"
                aria-checked={false}
              >
                <TableCell>{onu.sn}</TableCell>
                <TableCell>{onu.port}</TableCell>
                <TableCell>
                  {new Date(onu.firstSeen).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Tooltip title="Clique para provisionar esta ONU">
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenProvisionDialog(onu)}
                      aria-label={`Provisionar ONU ${onu.sn}`}
                    >
                      Provisionar
                    </Button>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredOnus.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count}`
          }
          labelRowsPerPage="Linhas por página:"
        />
      </TableContainer>

      <Dialog 
        open={provisionDialogOpen} 
        onClose={handleCloseProvisionDialog}
        maxWidth="sm"
        fullWidth
        aria-labelledby="provision-dialog-title"
      >
        <DialogTitle id="provision-dialog-title">
          Provisionar ONU
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
            Pressione Enter para confirmar ou Esc para cancelar
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Serial Number: {selectedOnu?.sn}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                value={provisionData.description}
                onChange={handleProvisionDataChange('description')}
                variant="outlined"
                required
                error={!!validationErrors.description}
                helperText={validationErrors.description}
                aria-label="Descrição da ONU"
                inputProps={{
                  'aria-describedby': 'description-error-text'
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Porta"
                value={provisionData.port}
                onChange={handleProvisionDataChange('port')}
                variant="outlined"
                required
                error={!!validationErrors.port}
                helperText={validationErrors.port || "Formato: frame/slot/port (exemplo: 0/1/1)"}
                aria-label="Porta da ONU"
                inputProps={{
                  'aria-describedby': 'port-error-text'
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseProvisionDialog}
            aria-label="Cancelar provisionamento"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleProvision}
            variant="contained"
            color="primary"
            disabled={
              !provisionData.description || 
              !provisionData.port || 
              provisioning || 
              !!validationErrors.description || 
              !!validationErrors.port
            }
            aria-label="Confirmar provisionamento"
          >
            {provisioning ? <CircularProgress size={24} /> : 'Provisionar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
});

export default UnauthorizedONUs; 