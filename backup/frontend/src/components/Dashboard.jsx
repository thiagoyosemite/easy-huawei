import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  styled,
  useTheme,
  CircularProgress,
  Alert,
  CardActionArea,
  Button
} from '@mui/material';
import {
  Router as RouterIcon,
  Public as PublicIcon,
  SignalCellular4Bar as SignalIcon,
  Cable as CableIcon,
  AutoFixHigh as MagicWandIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Card personalizado com imagem de fundo
const StyledCard = styled(Card)(({ theme, bgimage }) => ({
  cursor: 'pointer',
  transition: 'transform 0.2s',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    right: '16px',
    transform: 'translateY(-50%)',
    width: '64px',
    height: '64px',
    backgroundImage: `url(${bgimage})`,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    opacity: 0.2,
    pointerEvents: 'none'
  }
}));

// URLs das imagens
const images = {
  unauthorized: '/images/onu-unauthorized.svg',
  online: '/images/onu-online.svg',
  offline: '/images/onu-offline.svg',
  failed: '/images/onu-failed.svg',
  total: '/images/onu-total.svg'
};

function StatCard({ title, value, color, bgColor, onClick }) {
  return (
    <Card 
      sx={{ 
        bgcolor: bgColor,
        cursor: 'pointer',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.02)'
        }
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          {title === "ONUs não Autorizadas" && <MagicWandIcon sx={{ mr: 1, color: color }} />}
          {title === "ONUs Online" && <PublicIcon sx={{ mr: 1, color: color }} />}
          {title === "ONUs Offline" && <CableIcon sx={{ mr: 1, color: color }} />}
          {title === "ONUs com Sinal Alto" && <SignalIcon sx={{ mr: 1, color: color }} />}
          {title === "Total de ONUs" && <RouterIcon sx={{ mr: 1, color: color }} />}
          <Typography variant="h6" component="div" sx={{ color: color }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ color: color, fontWeight: 'bold' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();

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
        let errorMessage = 'Erro ao carregar dados do dashboard';
        
        if (err.message === 'Network Error') {
          errorMessage = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 3006.';
        } else if (err.response?.status === 404) {
          errorMessage = 'Endpoint não encontrado no servidor.';
        } else if (err.response?.status === 500) {
          errorMessage = 'Erro interno no servidor: ' + (err.response.data?.error || err.message);
        } else {
          errorMessage += ': ' + (err.response?.data?.error || err.message);
        }
        
        setError(errorMessage);
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

  const handleCardClick = (route) => {
    navigate(route);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Informações da OLT */}
      <Grid container spacing={2}>
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
          <StatCard
            title="ONUs não Autorizadas"
            value={stats.onuStats.unauthorized || 0}
            color="#0288d1"
            bgColor="#e3f2fd"
            onClick={() => handleCardClick('/unauthorized-onus')}
          />
        </Grid>

        {/* ONUs Online */}
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="ONUs Online"
            value={stats.onuStats.online || 0}
            color="#2e7d32"
            bgColor="#e8f5e9"
            onClick={() => handleCardClick('/online-onus')}
          />
        </Grid>

        {/* ONUs Offline */}
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="ONUs Offline"
            value={stats.onuStats.offline || 0}
            color="#d32f2f"
            bgColor="#ffebee"
            onClick={() => handleCardClick('/offline-onus')}
          />
        </Grid>

        {/* ONUs com Sinal Alto */}
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="ONUs com Sinal Alto"
            value={stats.onuStats.highSignal || 0}
            color="#ef6c00"
            bgColor="#fff3e0"
            onClick={() => handleCardClick('/failed-onus')}
          />
        </Grid>

        {/* Total de ONUs */}
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total de ONUs"
            value={stats.onuStats.total || 0}
            color="#1976d2"
            bgColor="#e3f2fd"
            onClick={() => handleCardClick('/onus')}
          />
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
    </Box>
  );
}

export default Dashboard; 