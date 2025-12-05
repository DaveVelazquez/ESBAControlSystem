import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Stack,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { clientsService } from '@/services/clients.service';
import type { Client, ClientContact, ClientLocation, ClientContract } from '@/types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [client, setClient] = useState<Client | null>(null);
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [locations, setLocations] = useState<ClientLocation[]>([]);
  const [contracts, setContracts] = useState<ClientContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  
  // Form states
  const [editFormData, setEditFormData] = useState<Partial<Client>>({});
  const [contactDialog, setContactDialog] = useState(false);
  const [locationDialog, setLocationDialog] = useState(false);
  const [contractDialog, setContractDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ClientContact | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<ClientLocation | null>(null);
  const [selectedContract, setSelectedContract] = useState<ClientContract | null>(null);

  useEffect(() => {
    if (id) {
      loadClient();
      loadContacts();
      loadLocations();
      loadContracts();
    }
    if (searchParams.get('edit') === 'true') {
      setEditMode(true);
    }
  }, [id, searchParams]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const data = await clientsService.getClient(id!);
      setClient(data);
      setEditFormData(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar cliente');
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const response = await clientsService.getContacts(id!);
      setContacts(response.data);
    } catch (err: any) {
      console.error('Error loading contacts:', err);
    }
  };

  const loadLocations = async () => {
    try {
      const response = await clientsService.getLocations(id!);
      setLocations(response.data);
    } catch (err: any) {
      console.error('Error loading locations:', err);
    }
  };

  const loadContracts = async () => {
    try {
      const response = await clientsService.getContracts(id!);
      setContracts(response.data);
    } catch (err: any) {
      console.error('Error loading contracts:', err);
    }
  };

  const handleSaveClient = async () => {
    try {
      await clientsService.updateClient(id!, editFormData);
      setSuccess('Cliente actualizado exitosamente');
      setEditMode(false);
      loadClient();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar cliente');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (window.confirm('¿Está seguro de eliminar este contacto?')) {
      try {
        await clientsService.deleteContact(id!, contactId);
        setSuccess('Contacto eliminado');
        loadContacts();
      } catch (err: any) {
        setError(err.message || 'Error al eliminar contacto');
      }
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (window.confirm('¿Está seguro de eliminar esta ubicación?')) {
      try {
        await clientsService.deleteLocation(id!, locationId);
        setSuccess('Ubicación eliminada');
        loadLocations();
      } catch (err: any) {
        setError(err.message || 'Error al eliminar ubicación');
      }
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (window.confirm('¿Está seguro de eliminar este contrato?')) {
      try {
        await clientsService.deleteContract(id!, contractId);
        setSuccess('Contrato eliminado');
        loadContracts();
      } catch (err: any) {
        setError(err.message || 'Error al eliminar contrato');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !client) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/clients')} sx={{ mt: 2 }}>
          Volver
        </Button>
      </Box>
    );
  }

  if (!client) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Cliente no encontrado</Alert>
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
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            {client.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {client.legal_name || 'Sin razón social'}
          </Typography>
        </Box>
        <Chip
          label={client.status === 'active' ? 'Activo' : 'Inactivo'}
          color={client.status === 'active' ? 'success' : 'default'}
        />
        {!editMode ? (
          <Button variant="contained" startIcon={<EditIcon />} onClick={() => setEditMode(true)}>
            Editar
          </Button>
        ) : (
          <>
            <Button onClick={() => { setEditMode(false); setEditFormData(client); }}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleSaveClient}>
              Guardar Cambios
            </Button>
          </>
        )}
      </Box>

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

      {/* Tabs */}
      <Card>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Información General" />
          <Tab label={`Contactos (${contacts.length})`} />
          <Tab label={`Ubicaciones (${locations.length})`} />
          <Tab label={`Contratos (${contracts.length})`} />
          <Tab label="Historial de Servicios" />
        </Tabs>

        {/* Tab 0: General Information */}
        <TabPanel value={tabValue} index={0}>
          <CardContent>
            {editMode ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre Comercial"
                    required
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Razón Social"
                    value={editFormData.legal_name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, legal_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={editFormData.status || 'active'}
                      label="Estado"
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as 'active' | 'inactive' })}
                    >
                      <MenuItem value="active">Activo</MenuItem>
                      <MenuItem value="inactive">Inactivo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Nombre Comercial
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {client.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Razón Social
                  </Typography>
                  <Typography variant="body1">
                    {client.legal_name || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Email
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <EmailIcon color="action" fontSize="small" />
                    <Typography variant="body1">
                      {client.email || '-'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Teléfono
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <PhoneIcon color="action" fontSize="small" />
                    <Typography variant="body1">
                      {client.phone || '-'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Estado
                  </Typography>
                  <Chip
                    label={client.status === 'active' ? 'Activo' : 'Inactivo'}
                    color={client.status === 'active' ? 'success' : 'default'}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Fecha de Registro
                  </Typography>
                  <Typography variant="body1">
                    {new Date(client.created_at).toLocaleDateString('es-MX')}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </TabPanel>

        {/* Tab 1: Contacts */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Contactos
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedContact(null);
                  setContactDialog(true);
                }}
              >
                Agregar Contacto
              </Button>
            </Box>

            {contacts.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <BusinessIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  No hay contactos registrados
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setContactDialog(true)}
                  sx={{ mt: 2 }}
                >
                  Agregar Primer Contacto
                </Button>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {contacts.map((contact) => (
                  <Grid item xs={12} md={6} key={contact.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" fontWeight="medium">
                              {contact.name}
                              {contact.is_primary && (
                                <Chip label="Principal" color="primary" size="small" sx={{ ml: 1 }} />
                              )}
                            </Typography>
                            {contact.title && (
                              <Typography variant="body2" color="text.secondary">
                                {contact.title}
                              </Typography>
                            )}
                          </Box>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedContact(contact);
                                  setContactDialog(true);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteContact(contact.id)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                        <Stack spacing={1}>
                          {contact.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2">{contact.email}</Typography>
                            </Box>
                          )}
                          {contact.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PhoneIcon fontSize="small" color="action" />
                              <Typography variant="body2">{contact.phone}</Typography>
                            </Box>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </TabPanel>

        {/* Tab 2: Locations */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Ubicaciones
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedLocation(null);
                  setLocationDialog(true);
                }}
              >
                Agregar Ubicación
              </Button>
            </Box>

            {locations.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <LocationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  No hay ubicaciones registradas
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setLocationDialog(true)}
                  sx={{ mt: 2 }}
                >
                  Agregar Primera Ubicación
                </Button>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {locations.map((location) => (
                  <Grid item xs={12} md={6} key={location.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" fontWeight="medium">
                              {location.name}
                              {location.is_default && (
                                <Chip label="Principal" color="primary" size="small" sx={{ ml: 1 }} />
                              )}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedLocation(location);
                                  setLocationDialog(true);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteLocation(location.id)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <LocationIcon fontSize="small" color="action" sx={{ mt: 0.3 }} />
                            <Typography variant="body2">{location.address}</Typography>
                          </Box>
                          {location.city && (
                            <Typography variant="body2" color="text.secondary" sx={{ pl: 3 }}>
                              {location.city}, {location.state} {location.postal_code}
                            </Typography>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </TabPanel>

        {/* Tab 3: Contracts */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Contratos y SLAs
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedContract(null);
                  setContractDialog(true);
                }}
              >
                Agregar Contrato
              </Button>
            </Box>

            {contracts.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  No hay contratos registrados
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setContractDialog(true)}
                  sx={{ mt: 2 }}
                >
                  Agregar Primer Contrato
                </Button>
              </Paper>
            ) : (
              <Stack spacing={2}>
                {contracts.map((contract) => {
                  const isExpired = contract.end_date && new Date(contract.end_date) < new Date();
                  const isExpiringSoon = contract.end_date && 
                    new Date(contract.end_date).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000;

                  return (
                    <Card key={contract.id} variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="h6" fontWeight="medium">
                                {contract.contract_type === 'service' ? 'Contrato de Servicio' : 
                                 contract.contract_type === 'maintenance' ? 'Contrato de Mantenimiento' : 
                                 'Otro Contrato'}
                              </Typography>
                              <Chip
                                label={contract.status === 'active' ? 'Activo' : 'Inactivo'}
                                color={contract.status === 'active' ? 'success' : 'default'}
                                size="small"
                              />
                              {isExpired && (
                                <Chip
                                  icon={<WarningIcon />}
                                  label="Vencido"
                                  color="error"
                                  size="small"
                                />
                              )}
                              {!isExpired && isExpiringSoon && (
                                <Chip
                                  icon={<WarningIcon />}
                                  label="Por vencer"
                                  color="warning"
                                  size="small"
                                />
                              )}
                            </Box>
                            <Grid container spacing={2}>
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">
                                  Fecha de Inicio
                                </Typography>
                                <Typography variant="body2">
                                  {new Date(contract.start_date).toLocaleDateString('es-MX')}
                                </Typography>
                              </Grid>
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">
                                  Fecha de Fin
                                </Typography>
                                <Typography variant="body2">
                                  {contract.end_date ? new Date(contract.end_date).toLocaleDateString('es-MX') : 'Sin límite'}
                                </Typography>
                              </Grid>
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">
                                  SLA Respuesta
                                </Typography>
                                <Typography variant="body2">
                                  {contract.sla_response_time ? `${contract.sla_response_time} min` : '-'}
                                </Typography>
                              </Grid>
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">
                                  SLA Resolución
                                </Typography>
                                <Typography variant="body2">
                                  {contract.sla_resolution_time ? `${contract.sla_resolution_time} min` : '-'}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Box>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedContract(contract);
                                  setContractDialog(true);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteContract(contract.id)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Box>
        </TabPanel>

        {/* Tab 4: Service History */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ px: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Historial de Servicios
            </Typography>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Esta funcionalidad estará disponible próximamente
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Aquí podrás ver todas las órdenes de trabajo asociadas a este cliente
              </Typography>
            </Paper>
          </Box>
        </TabPanel>
      </Card>

      {/* Contact Dialog - Placeholder for now */}
      <Dialog open={contactDialog} onClose={() => setContactDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedContact ? 'Editar Contacto' : 'Nuevo Contacto'}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ py: 2 }}>
            Funcionalidad en desarrollo...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Location Dialog - Placeholder for now */}
      <Dialog open={locationDialog} onClose={() => setLocationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedLocation ? 'Editar Ubicación' : 'Nueva Ubicación'}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ py: 2 }}>
            Funcionalidad en desarrollo...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLocationDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Contract Dialog - Placeholder for now */}
      <Dialog open={contractDialog} onClose={() => setContractDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedContract ? 'Editar Contrato' : 'Nuevo Contrato'}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ py: 2 }}>
            Funcionalidad en desarrollo...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContractDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientDetail;
