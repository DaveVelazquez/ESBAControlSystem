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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  InputAdornment,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Fab,
  Paper,
  Stack,
  Select,
  FormControl,
  InputLabel,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Assignment as AssignmentIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { clientsService, type CreateClientData } from '@/services/clients.service';
import type { Client } from '@/types';

const ClientsList: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<CreateClientData>({
    name: '',
    legal_name: '',
    email: '',
    phone: '',
    status: 'active'
  });

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      loadClients();
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [search, statusFilter]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const response = await clientsService.getClients(params);
      setClients(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.name.trim()) {
        setError('El nombre es requerido');
        return;
      }
      
      const newClient = await clientsService.createClient(formData);
      setOpenDialog(false);
      setFormData({ name: '', legal_name: '', email: '', phone: '', status: 'active' });
      setSuccess('Cliente creado exitosamente');
      loadClients();
      
      // Auto-navegar al nuevo cliente
      setTimeout(() => navigate(`/clients/${newClient.id}`), 1000);
    } catch (err: any) {
      setError(err.message || 'Error al crear cliente');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, client: Client) => {
    setAnchorEl(event.currentTarget);
    setSelectedClient(client);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClient(null);
  };

  const handleDelete = async () => {
    if (selectedClient && window.confirm(`¿Está seguro de desactivar a ${selectedClient.name}?`)) {
      try {
        await clientsService.deleteClient(selectedClient.id);
        setSuccess('Cliente desactivado exitosamente');
        loadClients();
        handleMenuClose();
      } catch (err: any) {
        setError(err.message || 'Error al desactivar cliente');
      }
    }
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return '';
    // Format: +52 (xxx) xxx-xxxx
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'default';
  };

  const getStatusLabel = (status: string) => {
    return status === 'active' ? 'Activo' : 'Inactivo';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Gestión de Clientes
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Administra la información de tus clientes y sus servicios
          </Typography>
        </Box>
      </Box>

      {/* Filters Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Buscar por nombre, razón social, email o teléfono..."
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
          
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={statusFilter}
              label="Estado"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="active">Activos</MenuItem>
              <MenuItem value="inactive">Inactivos</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            Nuevo Cliente
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

      {/* Clients Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Cliente</strong></TableCell>
                <TableCell><strong>Razón Social</strong></TableCell>
                <TableCell><strong>Contacto</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">
                      No se encontraron clientes
                    </Typography>
                    {search || statusFilter !== 'all' ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Intenta ajustar los filtros de búsqueda
                      </Typography>
                    ) : null}
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow 
                    key={client.id}
                    hover
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <TableCell onClick={() => navigate(`/clients/${client.id}`)}>
                      <Typography variant="body2" fontWeight="medium">
                        {client.name}
                      </Typography>
                    </TableCell>
                    <TableCell onClick={() => navigate(`/clients/${client.id}`)}>
                      <Typography variant="body2" color="text.secondary">
                        {client.legal_name || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell onClick={() => navigate(`/clients/${client.id}`)}>
                      <Box>
                        {client.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <EmailIcon sx={{ fontSize: 16, color: 'action.active' }} />
                            <Typography variant="body2">{client.email}</Typography>
                          </Box>
                        )}
                        {client.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 16, color: 'action.active' }} />
                            <Typography variant="body2">{formatPhone(client.phone)}</Typography>
                          </Box>
                        )}
                        {!client.email && !client.phone && (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell onClick={() => navigate(`/clients/${client.id}`)}>
                      <Chip
                        label={getStatusLabel(client.status)}
                        color={getStatusColor(client.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Ver detalles">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/clients/${client.id}`)}
                            color="primary"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/clients/${client.id}?edit=true`)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Más opciones">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, client)}
                          >
                            <MoreVertIcon fontSize="small" />
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

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedClient && navigate(`/clients/${selectedClient.id}`)}>
          <ViewIcon sx={{ mr: 1, fontSize: 20 }} />
          Ver detalles
        </MenuItem>
        <MenuItem onClick={() => selectedClient && navigate(`/clients/${selectedClient.id}?edit=true`)}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Editar
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Desactivar
        </MenuItem>
      </Menu>

      {/* Create Client Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Nuevo Cliente
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              label="Nombre Comercial"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Acme Corporation"
              helperText="Nombre con el que se conoce al cliente"
            />
            <TextField
              fullWidth
              label="Razón Social"
              value={formData.legal_name}
              onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
              placeholder="Ej: Acme Corporation S.A. de C.V."
              helperText="Nombre legal registrado (opcional)"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contacto@empresa.com"
            />
            <TextField
              fullWidth
              label="Teléfono"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(55) 1234-5678"
            />
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={formData.status}
                label="Estado"
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              >
                <MenuItem value="active">Activo</MenuItem>
                <MenuItem value="inactive">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreate} 
            variant="contained"
            disabled={!formData.name.trim()}
          >
            Crear Cliente
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientsList;
