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
  Alert
} from '@mui/material';
import { clientsService } from '@/services/clients.service';
import type { ClientContact } from '@/types';

interface ContactDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
  contact?: ClientContact | null;
}

const ContactDialog: React.FC<ContactDialogProps> = ({
  open,
  onClose,
  onSuccess,
  clientId,
  contact
}) => {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    is_primary: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        title: contact.title || '',
        email: contact.email || '',
        phone: contact.phone || '',
        is_primary: contact.is_primary
      });
    } else {
      setFormData({
        name: '',
        title: '',
        email: '',
        phone: '',
        is_primary: false
      });
    }
    setError(null);
  }, [contact, open]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Email inválido');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (contact) {
        await clientsService.updateContact(clientId, contact.id, formData);
      } else {
        await clientsService.createContact(clientId, formData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar contacto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {contact ? 'Editar Contacto' : 'Nuevo Contacto'}
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
              label="Nombre Completo"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Juan Pérez García"
              helperText="Nombre del contacto principal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Puesto"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Gerente de Operaciones"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="juan.perez@empresa.com"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Teléfono"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(55) 1234-5678"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_primary}
                  onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                />
              }
              label="Marcar como contacto principal"
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
          disabled={loading || !formData.name.trim()}
        >
          {loading ? 'Guardando...' : contact ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContactDialog;
