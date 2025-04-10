import { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, CircularProgress, Alert } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '../api';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    oltInfo: null,
    onuStats: {
      total: 0,
      online: 0,
      offline: 0,
      unauthorized: 0,
      highSignal: 0
    },
    authHistory: [],
    lossHistory: [],
    systemMetrics: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar informações da OLT
        const oltResponse = await api.get('/olt/info');
        
        // Buscar ONUs
        const onusResponse = await api.get('/onus');
        
        // Buscar ONUs não autorizadas
        const unauthorizedResponse = await api.get('/unauthorized-onus');

        // Buscar histórico de autorizações (últimos 7 dias)
        const authHistoryResponse = await api.get('/auth-history');

        // Buscar histórico de perdas de sinal
        const lossHistoryResponse = await api.get('/loss-history');

        // Buscar métricas do sistema
        const systemMetricsResponse = await api.get('/system-metrics');

        // Calcular estatísticas
        const onlineOnus = onusResponse.data.filter(onu => onu.status === 'online').length;
        const totalOnus = onusResponse.data.length;
        const highSignalOnus = onusResponse.data.filter(onu => onu.signal >= -15).length;

        setStats({
          oltInfo: oltResponse.data,
          onuStats: {
            total: totalOnus,
            online: onlineOnus,
            offline: totalOnus - onlineOnus,
            unauthorized: unauthorizedResponse.data.length,
            highSignal: highSignalOnus
          },
          authHistory: authHistoryResponse.data,
          lossHistory: lossHistoryResponse.data,
          systemMetrics: systemMetricsResponse.data
        });
      } catch (err) {
        setError('Erro ao carregar dados do dashboard: ' + (err.response?.data?.error || err.message));
        console.error('Erro detalhado:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          endpoint: err.config?.url
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Grid container spacing={2} justifyContent="center" alignItems="center" style={{ minHeight: '400px' }}>
        <CircularProgress />
      </Grid>
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
    <Grid container spacing={2}>
      {/* Informações da OLT */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>
              Informações da OLT
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography color="textSecondary">Modelo</Typography>
                <Typography variant="body1">{stats.oltInfo?.model || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography color="textSecondary">Versão</Typography>
                <Typography variant="body1">{stats.oltInfo?.version || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography color="textSecondary">Uptime</Typography>
                <Typography variant="body1">{stats.oltInfo?.uptime || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography color="textSecondary">Temperatura</Typography>
                <Typography variant="body1">{stats.oltInfo?.temperature || 'N/A'}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* ONUs não Autorizadas */}
      <Grid item xs={12} sm={6} md={2.4}>
        <Card sx={{ bgcolor: '#bbdefb' }}> {/* Azul claro */}
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>
              ONUs não Autorizadas
            </Typography>
            <Typography variant="h3" component="div" sx={{ color: '#1976d2' }}>
              {stats.onuStats.unauthorized}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* ONUs Online */}
      <Grid item xs={12} sm={6} md={2.4}>
        <Card sx={{ bgcolor: '#e8f5e9' }}> {/* Verde claro */}
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32' }}>
              ONUs Online
            </Typography>
            <Typography variant="h3" component="div" sx={{ color: '#2e7d32' }}>
              {stats.onuStats.online}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Sinal Alto */}
      <Grid item xs={12} sm={6} md={2.4}>
        <Card sx={{ bgcolor: '#fff3e0' }}> {/* Laranja claro */}
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#ef6c00' }}>
              Sinal Alto
            </Typography>
            <Typography variant="h3" component="div" sx={{ color: '#ef6c00' }}>
              {stats.onuStats.highSignal}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* ONUs Offline */}
      <Grid item xs={12} sm={6} md={2.4}>
        <Card sx={{ bgcolor: '#ffebee' }}> {/* Vermelho claro */}
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#c62828' }}>
              ONUs Offline
            </Typography>
            <Typography variant="h3" component="div" sx={{ color: '#c62828' }}>
              {stats.onuStats.offline}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Total de ONUs */}
      <Grid item xs={12} sm={6} md={2.4}>
        <Card sx={{ bgcolor: '#1976d2' }}> {/* Azul escuro */}
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              Total de ONUs
            </Typography>
            <Typography variant="h3" component="div" sx={{ color: 'white' }}>
              {stats.onuStats.total}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Gráficos */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>
              Autorizações por Dia
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.authHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#1976d2" 
                  fill="#bbdefb" 
                  name="ONUs Autorizadas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#c62828' }}>
              Perdas de Sinal
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.lossHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#c62828" 
                  name="Perdas de Sinal"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32' }}>
              Métricas do Sistema
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.systemMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#2e7d32" 
                  name="CPU (%)"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="bandwidth" 
                  stroke="#1976d2" 
                  name="Banda (Mbps)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default Dashboard; 