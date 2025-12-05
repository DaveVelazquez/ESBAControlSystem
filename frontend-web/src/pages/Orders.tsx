import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  InputAdornment,
  Tooltip,
  Stack,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { clientsService } from '@/services/clients.service';
import type { Client, ClientLocation } from '@/types';

interface WorkOrder {
  id: string;
  order_number: string;
  client_id: string;
  client_name: string;
  location_id?: string;
  location_name?: string;
  technician_id?: string;
  technician_name?: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date?: string;
  sla_response_time?: number;
  sla_resolution_time?: number;
  created_at: string;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  // Create Order Dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientLocations, setClientLocations] = useState<ClientLocation[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    location_id: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    scheduled_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadOrders();
    loadClients();
  }, [statusFilter, priorityFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual API call
      setOrders([]);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar órdenes');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await clientsService.getClients({ status: 'active' });
      setClients(response.data);
    } catch (err: any) {
      console.error('Error loading clients:', err);
    }
  };

  const handleClientChange = async (client: Client | null) => {
    setSelectedClient(client);
    setFormData({ ...formData, client_id: client?.id || '', location_id: '' });
    
    if (client) {
      try {
        const locations = await clientsService.getLocations(client.id);
        setClientLocations(locations);
        
        // Auto-select default location if exists
        const defaultLocation = locations.find(loc => loc.is_default);
        if (defaultLocation) {
          setFormData(prev => ({ ...prev, location_id: defaultLocation.id }));
        }
      } catch (err: any) {
        console.error('Error loading locations:', err);
      }
    } else {
      setClientLocations([]);
    }
  };

  const handleCreateOrder = async () => {
    if (!formData.client_id || !formData.description.trim()) {
      setError('Cliente y descripción son requeridos');
      return;
    }

    try {
      setLoading(true);
      // TODO: Implement actual API call to create order
      // const newOrder = await ordersService.createOrder(formData);
      
      setSuccess('Orden de trabajo creada exitosamente');
      setOpenDialog(false);
      resetForm();
      loadOrders();
    } catch (err: any) {
      setError(err.message || 'Error al crear orden');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      location_id: '',
      description: '',
      priority: 'medium',
      scheduled_date: new Date().toISOString().split('T')[0]
    });
    setSelectedClient(null);
    setClientLocations([]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'assigned':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: { [key: string]: string } = {
      urgent: 'Urgente',
      high: 'Alta',
      medium: 'Media',
      low: 'Baja'
    };
    return labels[priority] || priority;
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: 'Pendiente',
      assigned: 'Asignada',
      in_progress: 'En Progreso',
      completed: 'Completada',
      cancelled: 'Cancelada'
    };
    return labels[status] || status;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Órdenes de Trabajo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gestiona y asigna órdenes de servicio a técnicos
          </Typography>
        </Box>
      </Box>

      {/* Filters Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Buscar por número, cliente o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={statusFilter}
              label="Estado"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="pending">Pendiente</MenuItem>
              <MenuItem value="assigned">Asignada</MenuItem>
              <MenuItem value="in_progress">En Progreso</MenuItem>
              <MenuItem value="completed">Completada</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Prioridad</InputLabel>
            <Select
              value={priorityFilter}
              label="Prioridad"
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="urgent">Urgente</MenuItem>
              <MenuItem value="high">Alta</MenuItem>
              <MenuItem value="medium">Media</MenuItem>
              <MenuItem value="low">Baja</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            Nueva Orden
          </Button>
        </Stack>
      </Paper>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Orders Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Orden</strong></TableCell>
                <TableCell><strong>Cliente</strong></TableCell>
                <TableCell><strong>Ubicación</strong></TableCell>
                <TableCell><strong>Técnico</strong></TableCell>
                <TableCell><strong>Prioridad</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">
                      No se encontraron órdenes
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Crea tu primera orden de trabajo para comenzar
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => setOpenDialog(true)}
                      sx={{ mt: 2 }}
                    >
                      Crear Primera Orden
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        #{order.order_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <BusinessIcon sx={{ fontSize: 16, color: 'action.active' }} />
                        <Typography variant="body2">{order.client_name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {order.location_name || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PersonIcon sx={{ fontSize: 16, color: 'action.active' }} />
                        <Typography variant="body2">
                          {order.technician_name || 'Sin asignar'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPriorityLabel(order.priority)}
                        color={getPriorityColor(order.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(order.status)}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {order.scheduled_date ? 
                          new Date(order.scheduled_date).toLocaleDateString('es-MX') : 
                          new Date(order.created_at).toLocaleDateString('es-MX')
                        }
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Ver detalles">
                          <IconButton size="small" color="primary">
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" color="primary">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create Order Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Nueva Orden de Trabajo
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            {/* Client Selection */}
            <Grid item xs={12}>
              <Autocomplete
                options={clients}
                getOptionLabel={(option) => option.name}
                value={selectedClient}
                onChange={(_, newValue) => handleClientChange(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cliente"
                    required
                    placeholder="Selecciona un cliente"
                    helperText="Cliente para quien se realizará el servicio"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {option.name}
                      </Typography>
                      {option.legal_name && (
                        <Typography variant="caption" color="text.secondary">
                          {option.legal_name}
                        </Typography>
                      )}
                    </Box>
                  </li>
                )}
              />
            </Grid>

            {/* Location Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth disabled={!selectedClient || clientLocations.length === 0}>
                <InputLabel>Ubicación</InputLabel>
                <Select
                  value={formData.location_id}
                  label="Ubicación"
                  onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                >
                  {clientLocations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      <Box>
                        <Typography variant="body2">
                          {location.name}
                          {location.is_default && (
                            <Chip label="Principal" size="small" sx={{ ml: 1, height: 20 }} />
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {location.address}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedClient && clientLocations.length === 0 && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  Este cliente no tiene ubicaciones registradas
                </Typography>
              )}
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción del Servicio"
                required
                multiline
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe el trabajo a realizar..."
              />
            </Grid>

            {/* Priority and Date */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={formData.priority}
                  label="Prioridad"
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <MenuItem value="low">Baja</MenuItem>
                  <MenuItem value="medium">Media</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                  <MenuItem value="urgent">Urgente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha Programada"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* SLA Information */}
            {selectedClient && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    Los tiempos SLA se aplicarán automáticamente según el contrato activo del cliente.
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => { setOpenDialog(false); resetForm(); }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateOrder}
            disabled={loading || !formData.client_id || !formData.description.trim()}
          >
            {loading ? 'Creando...' : 'Crear Orden'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
