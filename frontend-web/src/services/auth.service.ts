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
    
    console.log('📡 [AUTH SERVICE] Response recibida');
    console.log('📡 [AUTH SERVICE] Response tipo:', typeof response);
    console.log('📡 [AUTH SERVICE] Response completo:', response);
    console.log('📡 [AUTH SERVICE] Response.data:', response.data);
    console.log('📡 [AUTH SERVICE] Response.user:', response.user);
    console.log('📡 [AUTH SERVICE] Response.token:', response.token);
    
    // Compatibilidad: el interceptor puede retornar response.data directamente o response completo
    // Si response tiene .user directamente, usar response; si no, usar response.data
    const data = response.user ? response : response.data;
    
    console.log('📡 [AUTH SERVICE] Data final:', data);
    console.log('📡 [AUTH SERVICE] User final:', data.user);
    console.log('📡 [AUTH SERVICE] Token final:', data.token);
    
    // El backend devuelve {success, message, token, user}
    return {
      user: data.user,
      token: data.token
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
