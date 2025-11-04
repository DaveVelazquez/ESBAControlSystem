// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'dispatcher' | 'technician';
  phone?: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Order Types
export type OrderStatus = 
  | 'pending'
  | 'assigned'
  | 'en_route'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'on_hold';

export type OrderPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  siteId: string;
  siteName: string;
  siteAddress: string;
  siteLatitude: number;
  siteLongitude: number;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  status: OrderStatus;
  priority: OrderPriority;
  serviceType: string;
  description: string;
  scheduledDate: string;
  slaDeadline: string;
  actualStart?: string;
  actualEnd?: string;
  estimatedDuration: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Technician Types
export interface TechnicianProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  skills: string[];
  rating: number;
  totalOrders: number;
  activeOrders: number;
  status: 'available' | 'busy' | 'offline';
  currentLatitude?: number;
  currentLongitude?: number;
  lastSeen?: string;
}

export interface TechnicianLocation {
  id: string;
  technicianId: string;
  orderId?: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: string;
  isActive: boolean;
}

// Evidence Types
export type EvidenceType = 'photo_before' | 'photo_after' | 'photo_issue' | 'signature' | 'document';

export interface Evidence {
  id: string;
  orderId: string;
  type: EvidenceType;
  fileUrl: string;
  thumbnailUrl?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  capturedAt: string;
  uploadedBy: string;
}

// Event Types
export interface OrderEvent {
  id: string;
  orderId: string;
  eventType: string;
  description: string;
  latitude?: number;
  longitude?: number;
  createdBy: string;
  createdAt: string;
}

// Stats Types
export interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  completedToday: number;
  pendingOrders: number;
  availableTechnicians: number;
  busyTechnicians: number;
  slaAlerts: number;
  avgCompletionTime: number;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// Map Types
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MarkerData {
  id: string;
  type: 'technician' | 'site' | 'order';
  latitude: number;
  longitude: number;
  data: any;
}

// Filter Types
export interface OrderFilters {
  status?: OrderStatus[];
  priority?: OrderPriority[];
  technicianId?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}
