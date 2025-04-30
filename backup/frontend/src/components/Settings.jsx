import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Grid,
  Switch,
  FormControlLabel
} from '@mui/material';
import api from '../services/api';

function Settings() {
  const [config, setConfig] = useState({
    oltHost: '',
    oltPort: '23',
    oltUsername: '',
    oltPassword: '',
    snmpPort: '161',
    snmpCommunity: 'public',
    simulationMode: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      setConfig(response.data);
    } catch (err) {
      setError('Erro ao carregar configurações');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    setConfig(prev => ({
      ...prev,
      [name]: name === 'simulationMode' ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      await api.post('/settings', config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Erro ao salvar configurações');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Configurações da OLT
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Configurações salvas com sucesso!
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Endereço da OLT"
                  name="oltHost"
                  value={config.oltHost}
                  onChange={handleChange}
                  margin="normal"
                  helperText="IP ou hostname da OLT"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Porta Telnet"
                  name="oltPort"
                  value={config.oltPort}
                  onChange={handleChange}
                  margin="normal"
                  type="number"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Usuário"
                  name="oltUsername"
                  value={config.oltUsername}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Senha"
                  name="oltPassword"
                  value={config.oltPassword}
                  onChange={handleChange}
                  margin="normal"
                  type="password"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Porta SNMP"
                  name="snmpPort"
                  value={config.snmpPort}
                  onChange={handleChange}
                  margin="normal"
                  type="number"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Comunidade SNMP"
                  name="snmpCommunity"
                  value={config.snmpCommunity}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.simulationMode}
                      onChange={handleChange}
                      name="simulationMode"
                    />
                  }
                  label="Modo de Simulação"
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  Salvar Configurações
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Settings; 