import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Paper,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { dashboardService } from '@/services/dashboard.service';
import type { DashboardStats } from '@/types';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactElement;
  color: string;
  subtitle?: string;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle, trend }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
              sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
            >
              {title}
            </Typography>
            <Typography
              variant={isMobile ? 'h4' : 'h3'}
              fontWeight="bold"
              sx={{ mb: 0.5 }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                <Typography variant="caption" color="success.main" fontWeight="medium">
                  {trend}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              width: isMobile ? 48 : 56,
              height: isMobile ? 48 : 56,
              borderRadius: 2,
              bgcolor: `${color}.lighter`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ml: 2,
            }}
          >
            {React.cloneElement(icon, {
              sx: {
                fontSize: isMobile ? 24 : 28,
                color: `${color}.main`,
              },
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress size={isMobile ? 40 : 60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Vista general del sistema de monitoreo
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Órdenes Totales"
            value={stats?.totalOrders || 0}
            icon={<AssignmentIcon />}
            color="primary"
            subtitle="Todas las órdenes"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Órdenes Activas"
            value={stats?.activeOrders || 0}
            icon={<AccessTimeIcon />}
            color="warning"
            subtitle="En progreso"
            trend="+5% desde ayer"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Completadas Hoy"
            value={stats?.completedToday || 0}
            icon={<CheckCircleIcon />}
            color="success"
            subtitle="Finalizadas"
            trend="+12% esta semana"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Alertas SLA"
            value={stats?.slaAlerts || 0}
            icon={<WarningIcon />}
            color="error"
            subtitle="Requieren atención"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Técnicos Disponibles"
            value={stats?.availableTechnicians || 0}
            icon={<PeopleIcon />}
            color="info"
            subtitle={`De ${(stats?.availableTechnicians || 0) + (stats?.busyTechnicians || 0)} total`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Técnicos Ocupados"
            value={stats?.busyTechnicians || 0}
            icon={<PeopleIcon />}
            color="secondary"
            subtitle="Trabajando"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Órdenes Pendientes"
            value={stats?.pendingOrders || 0}
            icon={<AssignmentIcon />}
            color="warning"
            subtitle="Sin asignar"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Tiempo Promedio"
            value={`${Math.round(stats?.avgCompletionTime || 0)}h`}
            icon={<AccessTimeIcon />}
            color="primary"
            subtitle="De completación"
          />
        </Grid>
      </Grid>

      {/* Recent Activity / Quick Actions */}
      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }}>
        {/* Active Orders Summary */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={2}
            sx={{
              p: isMobile ? 2 : 3,
              height: '100%',
            }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Órdenes Activas por Estado
            </Typography>
            <Box sx={{ mt: 2 }}>
              {[
                { status: 'En Ruta', count: Math.floor((stats?.activeOrders || 0) * 0.3), color: 'info' },
                { status: 'En Progreso', count: Math.floor((stats?.activeOrders || 0) * 0.5), color: 'primary' },
                { status: 'En Pausa', count: Math.floor((stats?.activeOrders || 0) * 0.2), color: 'warning' },
              ].map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                    pb: 2,
                    borderBottom: index < 2 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: `${item.color}.main`,
                      }}
                    />
                    <Typography variant="body2">{item.status}</Typography>
                  </Box>
                  <Chip
                    label={item.count}
                    size="small"
                    color={item.color as any}
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Technician Status */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={2}
            sx={{
              p: isMobile ? 2 : 3,
              height: '100%',
            }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Estado de Técnicos
            </Typography>
            <Box sx={{ mt: 2 }}>
              {[
                { 
                  status: 'Disponibles', 
                  count: stats?.availableTechnicians || 0, 
                  color: 'success',
                  percentage: Math.round(((stats?.availableTechnicians || 0) / ((stats?.availableTechnicians || 0) + (stats?.busyTechnicians || 0) + 2) || 0) * 100)
                },
                { 
                  status: 'Ocupados', 
                  count: stats?.busyTechnicians || 0, 
                  color: 'warning',
                  percentage: Math.round(((stats?.busyTechnicians || 0) / ((stats?.availableTechnicians || 0) + (stats?.busyTechnicians || 0) + 2) || 0) * 100)
                },
                { 
                  status: 'Desconectados', 
                  count: 2, 
                  color: 'error',
                  percentage: Math.round((2 / ((stats?.availableTechnicians || 0) + (stats?.busyTechnicians || 0) + 2) || 0) * 100)
                },
              ].map((item, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{item.status}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {item.count} ({item.percentage}%)
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: '100%',
                      height: 8,
                      bgcolor: 'grey.200',
                      borderRadius: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${item.percentage}%`,
                        height: '100%',
                        bgcolor: `${item.color}.main`,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
