import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Alert
} from '@mui/material';
import { onuService } from '../services/onuService';

const provisioningProfiles = [
  { id: 'residential', name: 'Residencial' },
  { id: 'business', name: 'Empresarial' },
  { id: 'dedicated', name: 'Dedicado' }
];

export default function ProvisionONU() {
  const { serial } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    port: '',
    vlan: '',
    lineProfile: '',
    srvProfile: '',
    coordinates: {
      latitude: '',
      longitude: ''
    }
  });

  useEffect(() => {
    const fetchONUInfo = async () => {
      try {
        setLoading(true);
        const data = await onuService.getUnauthorizedONUs();
        const onu = data.find(o => o.sn === serial);
        
        if (!onu) {
          setError('ONU não encontrada ou já autorizada');
          return;
        }

        setFormData(prev => ({
          ...prev,
          port: onu.port
        }));
      } catch (err) {
        setError('Erro ao carregar informações da ONU');
        console.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchONUInfo();
  }, [serial]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCoordinateChange = (coord) => (event) => {
    setFormData(prev => ({
      ...prev,
      coordinates: {
        ...prev.coordinates,
        [coord]: event.target.value
      }
    }));
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            coordinates: {
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString()
            }
          }));
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setError('Não foi possível obter a localização atual');
        }
      );
    } else {
      setError('Geolocalização não é suportada neste navegador');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      await onuService.provisionONU(serial, formData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/unauthorized-onus');
      }, 2000);
    } catch (err) {
      setError('Erro ao provisionar ONU');
      console.error('Erro:', err);
    } finally {
      setSaving(false);
    }
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
      <Typography variant="h6" gutterBottom>
        Provisionar ONU
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Serial: {serial}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ONU provisionada com sucesso! Redirecionando...
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Porta"
                name="port"
                value={formData.port}
                onChange={handleInputChange}
                required
                disabled
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="VLAN"
                name="vlan"
                type="number"
                value={formData.vlan}
                onChange={handleInputChange}
                required
                inputProps={{ min: 1, max: 4094 }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Perfil de Provisionamento</InputLabel>
                <Select
                  name="lineProfile"
                  value={formData.lineProfile}
                  onChange={handleInputChange}
                  label="Perfil de Provisionamento"
                >
                  {provisioningProfiles.map(profile => (
                    <MenuItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Coordenadas
              </Typography>
            </Grid>

            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label="Latitude"
                value={formData.coordinates.latitude}
                onChange={handleCoordinateChange('latitude')}
              />
            </Grid>

            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label="Longitude"
                value={formData.coordinates.longitude}
                onChange={handleCoordinateChange('longitude')}
              />
            </Grid>

            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleGetLocation}
                sx={{ height: '56px' }}
              >
                Obter Local
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/unauthorized-onus')}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} /> : 'Provisionar'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
} 