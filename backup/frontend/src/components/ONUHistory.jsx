import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const eventTypeLabels = {
  START: 'Inicialização',
  STOP: 'Parada',
  REBOOT: 'Reinicialização',
  CONFIGURE: 'Configuração',
  ERROR: 'Erro',
  STATUS_CHANGE: 'Mudança de Status'
};

const eventTypeColors = {
  START: 'success.main',
  STOP: 'warning.main',
  REBOOT: 'info.main',
  CONFIGURE: 'primary.main',
  ERROR: 'error.main',
  STATUS_CHANGE: 'secondary.main'
};

const MetricCard = ({ title, value, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" component="div" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" component="div" color="primary">
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

export default function ONUHistory({ serial }) {
  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    eventType: '',
    startDate: null,
    endDate: null
  });

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.eventType) {
        queryParams.append('eventType', filters.eventType);
      }
      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate.toISOString());
      }

      const response = await fetch(`/api/onus/${serial}/history?${queryParams}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar histórico');
      }
      const data = await response.json();
      setHistory(data);
      
      const metricsResponse = await fetch(`/api/onus/${serial}/metrics`);
      if (!metricsResponse.ok) {
        throw new Error('Erro ao carregar métricas');
      }
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [serial, filters]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Métricas */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total de Eventos"
            value={metrics?.total || 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Eventos (24h)"
            value={metrics?.last24h || 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Eventos (7 dias)"
            value={metrics?.lastWeek || 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Último Evento"
            value={metrics?.lastEvent?.type ? eventTypeLabels[metrics.lastEvent.type] : 'N/A'}
            subtitle={metrics?.lastEvent ? format(new Date(metrics.lastEvent.timestamp), 'dd/MM/yyyy HH:mm:ss') : ''}
          />
        </Grid>
      </Grid>

      {/* Filtros */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Tipo de Evento</InputLabel>
            <Select
              value={filters.eventType}
              label="Tipo de Evento"
              onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
            >
              <MenuItem value="">Todos</MenuItem>
              {Object.entries(eventTypeLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <DatePicker
            label="Data Inicial"
            value={filters.startDate}
            onChange={(newValue) => setFilters({ ...filters, startDate: newValue })}
            format="dd/MM/yyyy"
            slotProps={{
              textField: {
                fullWidth: true
              }
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DatePicker
            label="Data Final"
            value={filters.endDate}
            onChange={(newValue) => setFilters({ ...filters, endDate: newValue })}
            format="dd/MM/yyyy"
            slotProps={{
              textField: {
                fullWidth: true
              }
            }}
          />
        </Grid>
      </Grid>

      {/* Tabela de Histórico */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data/Hora</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Descrição</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((event, index) => (
              <TableRow key={index}>
                <TableCell>
                  {format(new Date(event.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <Typography color={eventTypeColors[event.type]}>
                    {eventTypeLabels[event.type]}
                  </Typography>
                </TableCell>
                <TableCell>{event.status}</TableCell>
                <TableCell>{event.description}</TableCell>
              </TableRow>
            ))}
            {history.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Nenhum evento encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
} 