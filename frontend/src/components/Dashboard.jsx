import { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, CircularProgress, Alert } from '@mui/material';
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
    }
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
          }
        });
      } catch (err) {
        setError('Erro ao carregar dados do dashboard');
        console.error('Erro:', err);
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
    <Grid container spacing={3}>
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
      <Grid item xs={12} sm={6} md={3}>
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
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: '#e8f5e9' }}> {/* Verde claro */}
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32' }}> {/* Verde escuro para texto */}
              ONUs Online
            </Typography>
            <Typography variant="h3" component="div" sx={{ color: '#2e7d32' }}>
              {stats.onuStats.online}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Sinal Alto */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: '#fff3e0' }}> {/* Laranja claro */}
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#ef6c00' }}> {/* Laranja escuro para texto */}
              Sinal Alto
            </Typography>
            <Typography variant="h3" component="div" sx={{ color: '#ef6c00' }}>
              {stats.onuStats.highSignal}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* ONUs Offline */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: '#ffebee' }}> {/* Vermelho claro */}
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#c62828' }}> {/* Vermelho escuro para texto */}
              ONUs Offline
            </Typography>
            <Typography variant="h3" component="div" sx={{ color: '#c62828' }}>
              {stats.onuStats.offline}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Total de ONUs */}
      <Grid item xs={12} sm={6} md={3}>
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
    </Grid>
  );
}

export default Dashboard; 