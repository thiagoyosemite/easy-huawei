import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  DoneAll as DoneAllIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import alertService from '../services/alertService';

const AlertIcon = ({ severity }) => {
  switch (severity) {
    case 'error':
      return <ErrorIcon color="error" />;
    case 'warning':
      return <WarningIcon color="warning" />;
    case 'info':
      return <InfoIcon color="info" />;
    case 'success':
      return <CheckCircleIcon color="success" />;
    default:
      return <InfoIcon color="info" />;
  }
};

function Alerts() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const activeAlerts = await alertService.getActiveAlerts();
      setAlerts(activeAlerts);
      setUnreadCount(activeAlerts.filter(alert => !alert.read).length);
    } catch (err) {
      setError('Erro ao carregar alertas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      await alertService.markAsRead(alertId);
      fetchAlerts();
    } catch (err) {
      setError('Erro ao marcar alerta como lido: ' + err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await alertService.markAllAsRead();
      fetchAlerts();
    } catch (err) {
      setError('Erro ao marcar todos os alertas como lidos: ' + err.message);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await alertService.resolveAlert(alertId);
      fetchAlerts();
    } catch (err) {
      setError('Erro ao resolver alerta: ' + err.message);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Atualizar a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <Box>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ position: 'relative' }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 360, maxHeight: 400 }
        }}
      >
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Alertas</Typography>
              {unreadCount > 0 && (
                <Button size="small" onClick={handleMarkAllAsRead}>
                  Marcar todas como lidas
                </Button>
              )}
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            ) : alerts.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center">
                Nenhum alerta ativo
              </Typography>
            ) : (
              <List>
                {alerts.map((alert) => (
                  <React.Fragment key={alert.id}>
                    <ListItem
                      sx={{
                        opacity: alert.read ? 0.7 : 1,
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <ListItemIcon>
                        <AlertIcon severity={alert.severity} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: alert.read ? 'normal' : 'bold' }}
                            >
                              {alert.title}
                            </Typography>
                            {!alert.resolved && (
                              <Chip
                                size="small"
                                label="Ativo"
                                color="error"
                                sx={{ height: 20 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={alert.message}
                      />
                      <Box display="flex" gap={1}>
                        {!alert.read && (
                          <IconButton
                            size="small"
                            onClick={() => handleMarkAsRead(alert.id)}
                            title="Marcar como lida"
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        )}
                        {!alert.resolved && (
                          <IconButton
                            size="small"
                            onClick={() => handleResolveAlert(alert.id)}
                            title="Resolver alerta"
                          >
                            <DoneAllIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Menu>
    </Box>
  );
}

export default Alerts; 