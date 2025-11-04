import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { login } from '@/store/authSlice';

const Login: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await dispatch(login(credentials));
    if (login.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card
          elevation={isMobile ? 2 : 8}
          sx={{
            borderRadius: isMobile ? 2 : 4,
          }}
        >
          <CardContent
            sx={{
              padding: isMobile ? 3 : 4,
            }}
          >
            {/* Logo and Title */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Box
                sx={{
                  width: isMobile ? 60 : 80,
                  height: isMobile ? 60 : 80,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <LoginIcon sx={{ fontSize: isMobile ? 32 : 40, color: 'white' }} />
              </Box>
              <Typography
                variant={isMobile ? 'h5' : 'h4'}
                fontWeight="bold"
                gutterBottom
                textAlign="center"
              >
                Field Service Manager
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                Sistema de Monitoreo de Técnicos en Campo
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Correo Electrónico"
                name="email"
                type="email"
                value={credentials.email}
                onChange={handleChange}
                required
                autoComplete="email"
                autoFocus
                sx={{ mb: 2 }}
                size={isMobile ? 'small' : 'medium'}
              />
              
              <TextField
                fullWidth
                label="Contraseña"
                name="password"
                type="password"
                value={credentials.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                sx={{ mb: 3 }}
                size={isMobile ? 'small' : 'medium'}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size={isMobile ? 'medium' : 'large'}
                disabled={loading}
                sx={{
                  py: isMobile ? 1 : 1.5,
                  fontWeight: 'bold',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                <strong>Credenciales de prueba:</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Admin: admin@company.com / Test1234
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Dispatcher: dispatcher@company.com / Test1234
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Técnico: tech1@company.com / Test1234
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;
