import api from './api';
import type { 
  Client, 
  ClientContact, 
  ClientLocation, 
  ClientContract,
  ClientServiceHistory,
  ApiResponse,
  PaginatedResponse
} from '@/types';

export interface CreateClientData {
  name: string;
  legal_name?: string;
  email?: string;
  phone?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateClientData extends Partial<CreateClientData> {}

export interface CreateContactData {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  is_primary?: boolean;
}

export interface CreateLocationData {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
}

export interface CreateContractData {
  contract_number?: string;
  start_date: string;
  end_date: string;
  sla_response_time?: number;
  sla_resolution_time?: number;
  file_url?: string;
  status?: 'active' | 'expired' | 'cancelled';
}

export const clientsService = {
  // ==================== CLIENTS ====================
  
  async getClients(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Client>> {
    const response = await api.get<ApiResponse<Client[]>>('/clients', { params });
    return {
      data: response.data,
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      pageSize: response.pagination?.limit || 50,
      totalPages: response.pagination?.pages || 1
    };
  },

  async getClient(id: string): Promise<Client> {
    const response = await api.get<ApiResponse<Client>>(`/clients/${id}`);
    return response.data;
  },

  async createClient(data: CreateClientData): Promise<Client> {
    const response = await api.post<ApiResponse<Client>>('/clients', data);
    return response.data;
  },

  async updateClient(id: string, data: UpdateClientData): Promise<Client> {
    const response = await api.put<ApiResponse<Client>>(`/clients/${id}`, data);
    return response.data;
  },

  async deleteClient(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },

  // ==================== CONTACTS ====================

  async getContacts(clientId: string): Promise<ClientContact[]> {
    const response = await api.get<ApiResponse<ClientContact[]>>(`/clients/${clientId}/contacts`);
    return response.data;
  },

  async createContact(clientId: string, data: CreateContactData): Promise<ClientContact> {
    const response = await api.post<ApiResponse<ClientContact>>(`/clients/${clientId}/contacts`, data);
    return response.data;
  },

  async updateContact(
    clientId: string,
    contactId: string,
    data: Partial<CreateContactData>
  ): Promise<ClientContact> {
    const response = await api.put<ApiResponse<ClientContact>>(
      `/clients/${clientId}/contacts/${contactId}`,
      data
    );
    return response.data;
  },

  async deleteContact(clientId: string, contactId: string): Promise<void> {
    await api.delete(`/clients/${clientId}/contacts/${contactId}`);
  },

  // ==================== LOCATIONS ====================

  async getLocations(clientId: string): Promise<ClientLocation[]> {
    const response = await api.get<ApiResponse<ClientLocation[]>>(`/clients/${clientId}/locations`);
    return response.data;
  },

  async createLocation(clientId: string, data: CreateLocationData): Promise<ClientLocation> {
    const response = await api.post<ApiResponse<ClientLocation>>(`/clients/${clientId}/locations`, data);
    return response.data;
  },

  async updateLocation(
    clientId: string,
    locationId: string,
    data: Partial<CreateLocationData>
  ): Promise<ClientLocation> {
    const response = await api.put<ApiResponse<ClientLocation>>(
      `/clients/${clientId}/locations/${locationId}`,
      data
    );
    return response.data;
  },

  async deleteLocation(clientId: string, locationId: string): Promise<void> {
    await api.delete(`/clients/${clientId}/locations/${locationId}`);
  },

  // ==================== CONTRACTS ====================

  async getContracts(clientId: string): Promise<ClientContract[]> {
    const response = await api.get<ApiResponse<ClientContract[]>>(`/clients/${clientId}/contracts`);
    return response.data;
  },

  async createContract(clientId: string, data: CreateContractData): Promise<ClientContract> {
    const response = await api.post<ApiResponse<ClientContract>>(`/clients/${clientId}/contracts`, data);
    return response.data;
  },

  async updateContract(
    clientId: string,
    contractId: string,
    data: Partial<CreateContractData>
  ): Promise<ClientContract> {
    const response = await api.put<ApiResponse<ClientContract>>(
      `/clients/${clientId}/contracts/${contractId}`,
      data
    );
    return response.data;
  },

  async deleteContract(clientId: string, contractId: string): Promise<void> {
    await api.delete(`/clients/${clientId}/contracts/${contractId}`);
  },

  // ==================== SERVICE HISTORY ====================

  async getServiceHistory(
    clientId: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<ClientServiceHistory>> {
    const response = await api.get<ApiResponse<ClientServiceHistory[]>>(
      `/clients/${clientId}/service-history`,
      { params }
    );
    return {
      data: response.data,
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      pageSize: response.pagination?.limit || 20,
      totalPages: Math.ceil((response.pagination?.total || 0) / (response.pagination?.limit || 20))
    };
  }
};
