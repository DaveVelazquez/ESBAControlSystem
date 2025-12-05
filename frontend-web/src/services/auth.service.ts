import api from './api';
import type { User, ApiResponse } from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    console.log('📡 [AUTH SERVICE] Enviando request a:', '/auth/login');
    console.log('📡 [AUTH SERVICE] Credentials:', { email: credentials.email, password: '***' });
    
    const response = await api.post<ApiResponse<{ user: User; token: string }>>(
      '/auth/login',
      credentials
    );
    
    console.log('📡 [AUTH SERVICE] Response recibida');
    console.log('📡 [AUTH SERVICE] Response data:', response.data);
    
    return response.data;
  },

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>(
      '/auth/register',
      data
    );
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },

  async refreshToken(): Promise<string> {
    const response = await api.post<ApiResponse<{ token: string }>>('/auth/refresh');
    return response.data.token;
  },
};
