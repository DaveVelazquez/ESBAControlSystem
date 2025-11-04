import api from './api';
import type { TechnicianProfile, TechnicianLocation, ApiResponse } from '@/types';

export const technicianService = {
  async getTechnicians(): Promise<TechnicianProfile[]> {
    const response = await api.get<ApiResponse<TechnicianProfile[]>>('/technicians');
    return response.data;
  },

  async getTechnicianById(id: string): Promise<TechnicianProfile> {
    const response = await api.get<ApiResponse<TechnicianProfile>>(`/technicians/${id}`);
    return response.data;
  },

  async getAvailableTechnicians(): Promise<TechnicianProfile[]> {
    const response = await api.get<ApiResponse<TechnicianProfile[]>>('/technicians?status=available');
    return response.data;
  },

  async getTechnicianLocation(id: string): Promise<TechnicianLocation | null> {
    const response = await api.get<ApiResponse<TechnicianLocation>>(`/technicians/${id}/location`);
    return response.data;
  },

  async getAllTechnicianLocations(): Promise<TechnicianLocation[]> {
    const response = await api.get<ApiResponse<TechnicianLocation[]>>('/locations/active');
    return response.data;
  },

  async updateTechnicianStatus(id: string, status: 'available' | 'busy' | 'offline'): Promise<TechnicianProfile> {
    const response = await api.patch<ApiResponse<TechnicianProfile>>(`/technicians/${id}/status`, {
      status,
    });
    return response.data;
  },
};
