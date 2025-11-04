import api from './api';
import type { Order, ApiResponse, PaginatedResponse, OrderFilters } from '@/types';

export interface CreateOrderData {
  clientId: string;
  siteId: string;
  serviceType: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate: string;
  estimatedDuration: number;
  notes?: string;
}

export interface UpdateOrderData {
  status?: string;
  assignedTechnicianId?: string;
  description?: string;
  priority?: string;
  scheduledDate?: string;
  notes?: string;
}

export const orderService = {
  async getOrders(filters?: OrderFilters, page = 1, pageSize = 20): Promise<PaginatedResponse<Order>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }
    params.append('page', String(page));
    params.append('pageSize', String(pageSize));

    const response = await api.get<ApiResponse<PaginatedResponse<Order>>>(
      `/orders?${params.toString()}`
    );
    return response.data;
  },

  async getOrderById(id: string): Promise<Order> {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data;
  },

  async createOrder(data: CreateOrderData): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>('/orders', data);
    return response.data;
  },

  async updateOrder(id: string, data: UpdateOrderData): Promise<Order> {
    const response = await api.put<ApiResponse<Order>>(`/orders/${id}`, data);
    return response.data;
  },

  async assignTechnician(orderId: string, technicianId: string): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>(`/orders/${orderId}/assign`, {
      technicianId,
    });
    return response.data;
  },

  async cancelOrder(orderId: string, reason: string): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>(`/orders/${orderId}/cancel`, {
      reason,
    });
    return response.data;
  },

  async deleteOrder(id: string): Promise<void> {
    await api.delete(`/orders/${id}`);
  },
};
