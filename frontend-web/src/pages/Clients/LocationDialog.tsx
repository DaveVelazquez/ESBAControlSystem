import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  Typography,
  Box
} from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';
import { clientsService } from '@/services/clients.service';
import type { ClientLocation } from '@/types';

interface LocationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
  location?: ClientLocation | null;
}

const LocationDialog: React.FC<LocationDialogProps> = ({
  open,
  onClose,
  onSuccess,
  clientId,
  location
}) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'México',
    latitude: '',
    longitude: '',
    is_default: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        address: location.address,
        city: location.city || '',
        state: location.state || '',
        postal_code: location.postal_code || '',
        country: location.country || 'México',
        latitude: location.latitude?.toString() || '',
        longitude: location.longitude?.toString() || '',
        is_default: location.is_default
      });
    } else {
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'México',
        latitude: '',
        longitude: '',
        is_default: false
      });
    }
    setError(null);
  }, [location, open]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('El nombre de la ubicación es requerido');
      return;
    }

    if (!formData.address.trim()) {
      setError('La dirección es requerida');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      };

      if (location) {
        await clientsService.updateLocation(clientId, location.id, payload);
      } else {
        await clientsService.createLocation(clientId, payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar ubicación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationIcon color="primary" />
          <span>{location ? 'Editar Ubicación' : 'Nueva Ubicación'}</span>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre de la Ubicación"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Oficina Central, Sucursal Norte"
              helperText="Un nombre descriptivo para identificar esta ubicación"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Dirección"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Calle, número, colonia"
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Ciudad"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Ej: Ciudad de México"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Estado"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="Ej: CDMX"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Código Postal"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              placeholder="Ej: 01000"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="País"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </Grid>

          {/* Coordinates Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Coordenadas GPS (Opcional)
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Latitud"
              type="number"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              placeholder="Ej: 19.432608"
              inputProps={{ step: 'any' }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Longitud"
              type="number"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              placeholder="Ej: -99.133209"
              inputProps={{ step: 'any' }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                />
              }
              label="Marcar como ubicación principal"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !formData.name.trim() || !formData.address.trim()}
        >
          {loading ? 'Guardando...' : location ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationDialog;
