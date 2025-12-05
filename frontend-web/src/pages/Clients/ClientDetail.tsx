import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { clientsService } from '@/services/clients.service';
import type { Client } from '@/types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (id) {
      loadClient();
    }
  }, [id]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const data = await clientsService.getClient(id!);
      setClient(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar cliente');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !client) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Cliente no encontrado'}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/clients')} sx={{ mt: 2 }}>
          Volver
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/clients')}>
          Volver
        </Button>
        <Typography variant="h4" fontWeight="bold" sx={{ flex: 1 }}>
          {client.name}
        </Typography>
        <Button variant="contained" onClick={() => navigate(`/clients/${id}/edit`)}>
          Editar
        </Button>
      </Box>

      {/* Tabs */}
      <Card>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Información General" />
          <Tab label="Contactos" />
          <Tab label="Ubicaciones" />
          <Tab label="Contratos y SLAs" />
          <Tab label="Historial de Servicios" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Datos del Cliente</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Nombre</Typography>
                <Typography>{client.name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Razón Social</Typography>
                <Typography>{client.legal_name || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Email</Typography>
                <Typography>{client.email || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Teléfono</Typography>
                <Typography>{client.phone || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Estado</Typography>
                <Typography>{client.status === 'active' ? 'Activo' : 'Inactivo'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Total de Órdenes</Typography>
                <Typography>{client.total_orders || 0}</Typography>
              </Box>
            </Box>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>Contactos</Typography>
          <Typography color="text.secondary">Funcionalidad en desarrollo...</Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>Ubicaciones</Typography>
          <Typography color="text.secondary">Funcionalidad en desarrollo...</Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>Contratos y SLAs</Typography>
          <Typography color="text.secondary">Funcionalidad en desarrollo...</Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>Historial de Servicios</Typography>
          <Typography color="text.secondary">Funcionalidad en desarrollo...</Typography>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default ClientDetail;
