import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Alert,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Divider
} from '@mui/material';
import { Description as DescriptionIcon, AccessTime as TimeIcon } from '@mui/icons-material';
import { clientsService } from '@/services/clients.service';
import type { ClientContract } from '@/types';

interface ContractDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
  contract?: ClientContract | null;
}

const ContractDialog: React.FC<ContractDialogProps> = ({
  open,
  onClose,
  onSuccess,
  clientId,
  contract
}) => {
  const [formData, setFormData] = useState({
    contract_type: 'service' as 'service' | 'maintenance' | 'other',
    start_date: '',
    end_date: '',
    sla_response_time: '',
    sla_resolution_time: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contract) {
      setFormData({
        contract_type: contract.contract_type,
        start_date: contract.start_date.split('T')[0],
        end_date: contract.end_date ? contract.end_date.split('T')[0] : '',
        sla_response_time: contract.sla_response_time?.toString() || '',
        sla_resolution_time: contract.sla_resolution_time?.toString() || '',
        status: contract.status
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        contract_type: 'service',
        start_date: today,
        end_date: '',
        sla_response_time: '',
        sla_resolution_time: '',
        status: 'active'
      });
    }
    setError(null);
  }, [contract, open]);

  const handleSubmit = async () => {
    if (!formData.start_date) {
      setError('La fecha de inicio es requerida');
      return;
    }

    if (formData.end_date && formData.start_date > formData.end_date) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...formData,
        sla_response_time: formData.sla_response_time ? parseInt(formData.sla_response_time) : null,
        sla_resolution_time: formData.sla_resolution_time ? parseInt(formData.sla_resolution_time) : null,
        end_date: formData.end_date || null
      };

      if (contract) {
        await clientsService.updateContract(clientId, contract.id, payload);
      } else {
        await clientsService.createContract(clientId, payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar contrato');
    } finally {
      setLoading(false);
    }
  };

  const getContractTypeLabel = (type: string) => {
    switch (type) {
      case 'service':
        return 'Contrato de Servicio';
      case 'maintenance':
        return 'Contrato de Mantenimiento';
      default:
        return 'Otro';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DescriptionIcon color="primary" />
          <span>{contract ? 'Editar Contrato' : 'Nuevo Contrato'}</span>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
          {/* Contract Type and Status */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Contrato</InputLabel>
              <Select
                value={formData.contract_type}
                label="Tipo de Contrato"
                onChange={(e) => setFormData({ ...formData, contract_type: e.target.value as any })}
              >
                <MenuItem value="service">Contrato de Servicio</MenuItem>
                <MenuItem value="maintenance">Contrato de Mantenimiento</MenuItem>
                <MenuItem value="other">Otro</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={formData.status}
                label="Estado"
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <MenuItem value="active">Activo</MenuItem>
                <MenuItem value="inactive">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Dates */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Fecha de Inicio"
              type="date"
              required
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Fecha en que inicia el contrato"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Fecha de Fin"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Dejar vacío para contratos sin límite"
            />
          </Grid>

          {/* SLA Section */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimeIcon fontSize="small" color="action" />
                <Typography variant="subtitle2" color="text.secondary">
                  Acuerdos de Nivel de Servicio (SLA)
                </Typography>
              </Box>
            </Divider>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tiempo de Respuesta"
              type="number"
              value={formData.sla_response_time}
              onChange={(e) => setFormData({ ...formData, sla_response_time: e.target.value })}
              InputProps={{
                endAdornment: <InputAdornment position="end">minutos</InputAdornment>
              }}
              helperText="Tiempo máximo para responder una solicitud"
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tiempo de Resolución"
              type="number"
              value={formData.sla_resolution_time}
              onChange={(e) => setFormData({ ...formData, sla_resolution_time: e.target.value })}
              InputProps={{
                endAdornment: <InputAdornment position="end">minutos</InputAdornment>
              }}
              helperText="Tiempo máximo para resolver una solicitud"
              inputProps={{ min: 0 }}
            />
          </Grid>

          {/* Information Box */}
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2">
                Los tiempos SLA se aplicarán automáticamente a las órdenes de trabajo creadas para este cliente.
              </Typography>
            </Alert>
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
          disabled={loading || !formData.start_date}
        >
          {loading ? 'Guardando...' : contract ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContractDialog;
