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
    
    // El interceptor retorna response.data directamente
    const data = await api.post<{ success: boolean; message: string; user: User; token: string }>(
      '/auth/login',
      credentials
    );
    
    console.log('📡 [AUTH SERVICE] Response recibida');
    console.log('📡 [AUTH SERVICE] Data completa:', data);
    console.log('📡 [AUTH SERVICE] User:', data.user);
    console.log('📡 [AUTH SERVICE] Token:', data.token);
    
    // El backend devuelve {success, message, token, user}
    return {
      user: data.user,
      token: data.token
    };
  },

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    // El interceptor retorna response.data directamente
    const response = await api.post<{ user: User; token: string }>(
      '/auth/register',
      data
    );
    return response;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async getCurrentUser(): Promise<User> {
    // El interceptor retorna response.data directamente
    const user = await api.get<User>('/auth/me');
    return user;
  },

  async refreshToken(): Promise<string> {
    // El interceptor retorna response.data directamente
    const data = await api.post<{ token: string }>('/auth/refresh');
    return data.token;
  },
};
