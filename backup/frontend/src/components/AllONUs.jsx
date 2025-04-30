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
  TableSortLabel,
  Typography,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import api from '../api';

function AllONUs() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onus, setOnus] = useState([]);
  const [filteredOnus, setFilteredOnus] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState('serial');
  const [order, setOrder] = useState('asc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/api/onus');
        setOnus(response.data);
        setFilteredOnus(response.data);
      } catch (err) {
        setError('Erro ao carregar ONUs');
        console.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const filtered = onus.filter(onu =>
      Object.values(onu).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredOnus(filtered);
  }, [searchTerm, onus]);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);

    const sorted = [...filteredOnus].sort((a, b) => {
      const aValue = a[property]?.toString() || '';
      const bValue = b[property]?.toString() || '';
      return (isAsc ? -1 : 1) * aValue.localeCompare(bValue);
    });
    setFilteredOnus(sorted);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'offline':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSignalColor = (signal) => {
    if (signal >= -15) return '#ef6c00'; // Laranja para sinal alto
    if (signal >= -25) return '#2e7d32'; // Verde para sinal bom
    if (signal >= -35) return '#ed6c02'; // Laranja para sinal médio
    return '#c62828'; // Vermelho para sinal ruim
  };

  const headCells = [
    { id: 'serial', label: 'Serial' },
    { id: 'description', label: 'Descrição' },
    { id: 'port', label: 'Porta' },
    { id: 'status', label: 'Status' },
    { id: 'signal', label: 'Sinal (dBm)' },
    { id: 'lastSeen', label: 'Última Visualização' }
  ];

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
      <Typography variant="h5" gutterBottom>
        Todas as ONUs
      </Typography>

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar ONU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
              {headCells.map((cell) => (
                <TableCell key={cell.id}>
                  <TableSortLabel
                    active={orderBy === cell.id}
                    direction={orderBy === cell.id ? order : 'asc'}
                    onClick={() => handleSort(cell.id)}
                  >
                    {cell.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOnus.map((onu) => (
              <TableRow key={onu.serial} hover>
                <TableCell>{onu.serial}</TableCell>
                <TableCell>{onu.description}</TableCell>
                <TableCell>{onu.port}</TableCell>
                <TableCell>
                  <Chip
                    label={onu.status}
                    color={getStatusColor(onu.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography sx={{ color: getSignalColor(onu.signal) }}>
                    {onu.signal}
                  </Typography>
                </TableCell>
                <TableCell>{new Date(onu.lastSeen).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default AllONUs; 