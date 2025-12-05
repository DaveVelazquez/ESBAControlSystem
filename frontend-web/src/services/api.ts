import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

// Use relative URL to leverage nginx proxy in production/container
// In development, set VITE_API_URL in .env to http://localhost:3000
const API_URL = import.meta.env.VITE_API_URL || '';

console.log('🔧 [API CONFIG] VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('🔧 [API CONFIG] API_URL:', API_URL);
console.log('🔧 [API CONFIG] Base URL:', API_URL ? `${API_URL}/api` : '/api');

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_URL ? `${API_URL}/api` : '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log('📤 [API REQUEST]', config.method?.toUpperCase(), config.url);
        console.log('📤 [API REQUEST] Full URL:', (config.baseURL || '') + (config.url || ''));
        
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('❌ [API REQUEST ERROR]', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log('📥 [API RESPONSE]', response.status, response.config.url);
        console.log('📥 [API RESPONSE] Data:', response.data);
        return response;
      },
      (error: AxiosError) => {
        console.error('❌ [API RESPONSE ERROR]', error.message);
        console.error('❌ [API RESPONSE ERROR] Status:', error.response?.status);
        console.error('❌ [API RESPONSE ERROR] Data:', error.response?.data);
        console.error('❌ [API RESPONSE ERROR] URL:', error.config?.url);
        
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }

  // Upload file with progress
  async uploadFile<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.axiosInstance.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }
}

export default new ApiService();
