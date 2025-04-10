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
  Typography
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SignalCellular4Bar as SignalIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import api from '../api';

function ONUs() {
  const [onus, setOnus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOnu, setSelectedOnu] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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

  const handleOpenDetails = (onu) => {
    setSelectedOnu(onu);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedOnu(null);
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
      <Box mb={3}>
        <TextField
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
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Serial</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Porta</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Sinal</TableCell>
              <TableCell>IP</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOnus
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((onu) => (
                <TableRow key={onu.id}>
                  <TableCell>{onu.sn}</TableCell>
                  <TableCell>{onu.description}</TableCell>
                  <TableCell>{`${onu.frame}/${onu.slot}/${onu.port}/${onu.onuId}`}</TableCell>
                  <TableCell>
                    <Chip
                      label={onu.status}
                      color={getStatusColor(onu.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<SignalIcon />}
                      label={`${onu.signal} dBm (${getSignalQuality(onu.signal)})`}
                      color={getSignalColor(onu.signal)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{onu.ip || 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenDetails(onu)}>
                      <InfoIcon />
                    </IconButton>
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small">
                      <DeleteIcon />
                    </IconButton>
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
        />
      </TableContainer>

      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
        <DialogTitle>Detalhes da ONU</DialogTitle>
        <DialogContent>
          {selectedOnu && (
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Serial</Typography>
              <Typography variant="body1" gutterBottom>{selectedOnu.sn}</Typography>

              <Typography variant="subtitle2" color="textSecondary">Descrição</Typography>
              <Typography variant="body1" gutterBottom>{selectedOnu.description}</Typography>

              <Typography variant="subtitle2" color="textSecondary">Localização</Typography>
              <Typography variant="body1" gutterBottom>
                {`Frame: ${selectedOnu.frame}, Slot: ${selectedOnu.slot}, Porta: ${selectedOnu.port}, ID: ${selectedOnu.onuId}`}
              </Typography>

              <Typography variant="subtitle2" color="textSecondary">Status</Typography>
              <Chip
                label={selectedOnu.status}
                color={getStatusColor(selectedOnu.status)}
                size="small"
                sx={{ my: 1 }}
              />

              <Typography variant="subtitle2" color="textSecondary">Sinal</Typography>
              <Chip
                icon={<SignalIcon />}
                label={`${selectedOnu.signal} dBm (${getSignalQuality(selectedOnu.signal)})`}
                color={getSignalColor(selectedOnu.signal)}
                size="small"
                sx={{ my: 1 }}
              />

              <Typography variant="subtitle2" color="textSecondary">IP</Typography>
              <Typography variant="body1" gutterBottom>{selectedOnu.ip || 'N/A'}</Typography>

              <Typography variant="subtitle2" color="textSecondary">Última Atualização</Typography>
              <Typography variant="body1" gutterBottom>
                {new Date(selectedOnu.lastSeen).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ONUs; 