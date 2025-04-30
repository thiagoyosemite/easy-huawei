import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { onuService } from '../services/onuService';

export default function UnauthorizedONUs() {
  const [onus, setOnus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchUnauthorizedONUs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await onuService.getUnauthorizedONUs();
      setOnus(data);
    } catch (err) {
      setError('Erro ao carregar ONUs não autorizadas');
      console.error('Erro ao buscar ONUs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnauthorizedONUs();
  }, []);

  const handleProvision = (onu) => {
    navigate(`/provision/${onu.sn}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">ONUs Aguardando Autorização</Typography>
        <IconButton onClick={fetchUnauthorizedONUs} title="Atualizar lista">
          <RefreshIcon />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {onus.length === 0 ? (
        <Alert severity="info">
          Não há ONUs aguardando autorização no momento.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Board</TableCell>
                <TableCell>Porta</TableCell>
                <TableCell>Serial</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {onus.map((onu) => (
                <TableRow key={onu.sn}>
                  <TableCell>{onu.board}</TableCell>
                  <TableCell>{onu.port}</TableCell>
                  <TableCell>{onu.sn}</TableCell>
                  <TableCell>{onu.type}</TableCell>
                  <TableCell align="right">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleProvision(onu)}
                    >
                      Autorizar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
} 