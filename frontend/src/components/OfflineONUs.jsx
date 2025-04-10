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
  InputAdornment,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PowerOffIcon from '@mui/icons-material/PowerOff';
import api from '../api';

function OfflineONUs() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onus, setOnus] = useState([]);
  const [filteredOnus, setFilteredOnus] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState('lastSeen');
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/onus');
        // Filtra ONUs que estão offline por dying gasp
        const offlineOnus = response.data.filter(onu => 
          onu.status === 'offline' && onu.lastEvent === 'dying_gasp'
        );
        setOnus(offlineOnus);
        setFilteredOnus(offlineOnus);
      } catch (err) {
        setError('Erro ao carregar ONUs desligadas: ' + (err.response?.data?.error || err.message));
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
      if (property === 'lastSeen') {
        return (isAsc ? -1 : 1) * (new Date(b.lastSeen) - new Date(a.lastSeen));
      }
      const aValue = a[property]?.toString() || '';
      const bValue = b[property]?.toString() || '';
      return (isAsc ? -1 : 1) * aValue.localeCompare(bValue);
    });
    setFilteredOnus(sorted);
  };

  const headCells = [
    { id: 'serial', label: 'Serial' },
    { id: 'description', label: 'Descrição' },
    { id: 'port', label: 'Porta' },
    { id: 'lastEvent', label: 'Último Evento' },
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
        ONUs Desligadas
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
                  <Tooltip title="ONU desligada">
                    <Chip
                      icon={<PowerOffIcon />}
                      label="Dying Gasp"
                      color="default"
                      size="small"
                    />
                  </Tooltip>
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

export default OfflineONUs; 