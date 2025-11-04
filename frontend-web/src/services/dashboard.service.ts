import api from './api';
import type { DashboardStats, ApiResponse } from '@/types';

export interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  technicianId?: string;
  clientId?: string;
  status?: string[];
}

export interface PerformanceMetrics {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  avgCompletionTime: number;
  slaCompliance: number;
  customerSatisfaction: number;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data;
  },

  async getPerformanceMetrics(filters: ReportFilters): Promise<PerformanceMetrics> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });

    const response = await api.get<ApiResponse<PerformanceMetrics>>(
      `/reports/performance?${params.toString()}`
    );
    return response.data;
  },

  async exportReport(filters: ReportFilters, format: 'pdf' | 'excel'): Promise<Blob> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });
    params.append('format', format);

    const response = await api.get(`/reports/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  },
};
