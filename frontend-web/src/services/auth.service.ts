import api from './api';
import type { User } from '@/types';

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
    
    const response: any = await api.post(
      '/auth/login',
      credentials
    );
    
    console.log('📡 [AUTH SERVICE] Response recibida:', response);
    
    // El backend devuelve {success, data: {token, user}}
    // El método api.post ya extrae response.data, así que response = {success, data: {token, user}}
    if (!response || !response.data) {
      throw new Error('Invalid response format from server');
    }
    
    return {
      user: response.data.user,
      token: response.data.token
    };
  },

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const response: any = await api.post(
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
    const response: any = await api.get('/auth/me');
    return response.data;
  },

  async refreshToken(): Promise<string> {
    const response: any = await api.post('/auth/refresh');
    return response.data.token;
  },
};
