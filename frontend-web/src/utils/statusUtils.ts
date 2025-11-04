import type { OrderStatus, OrderPriority } from '@/types';

export const getStatusColor = (status: OrderStatus): string => {
  const colors: Record<OrderStatus, string> = {
    pending: '#FFA726',
    assigned: '#29B6F6',
    en_route: '#66BB6A',
    in_progress: '#1976d2',
    completed: '#4CAF50',
    cancelled: '#F44336',
    on_hold: '#FF9800',
  };
  return colors[status] || '#757575';
};

export const getStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    pending: 'Pendiente',
    assigned: 'Asignada',
    en_route: 'En Ruta',
    in_progress: 'En Progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
    on_hold: 'En Pausa',
  };
  return labels[status] || status;
};

export const getPriorityColor = (priority: OrderPriority): string => {
  const colors: Record<OrderPriority, string> = {
    low: '#4CAF50',
    medium: '#FF9800',
    high: '#F44336',
    urgent: '#D32F2F',
  };
  return colors[priority] || '#757575';
};

export const getPriorityLabel = (priority: OrderPriority): string => {
  const labels: Record<OrderPriority, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente',
  };
  return labels[priority] || priority;
};
