import { io, Socket } from 'socket.io-client';
import type { TechnicianLocation, OrderEvent } from '@/types';

// Use relative URL to leverage nginx proxy in production/container
// In development, set VITE_SOCKET_URL in .env to http://localhost:3000
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Location tracking
  onLocationUpdate(callback: (location: TechnicianLocation) => void) {
    this.socket?.on('location:update', callback);
  }

  offLocationUpdate() {
    this.socket?.off('location:update');
  }

  // Order events
  onOrderUpdate(callback: (event: OrderEvent) => void) {
    this.socket?.on('order:update', callback);
  }

  offOrderUpdate() {
    this.socket?.off('order:update');
  }

  onOrderAssigned(callback: (data: any) => void) {
    this.socket?.on('order:assigned', callback);
  }

  offOrderAssigned() {
    this.socket?.off('order:assigned');
  }

  // Technician status
  onTechnicianStatusChange(callback: (data: any) => void) {
    this.socket?.on('technician:status', callback);
  }

  offTechnicianStatusChange() {
    this.socket?.off('technician:status');
  }

  // SLA alerts
  onSlaAlert(callback: (data: any) => void) {
    this.socket?.on('sla:alert', callback);
  }

  offSlaAlert() {
    this.socket?.off('sla:alert');
  }

  // Emit events
  joinOrderRoom(orderId: string) {
    this.socket?.emit('order:join', { orderId });
  }

  leaveOrderRoom(orderId: string) {
    this.socket?.emit('order:leave', { orderId });
  }

  sendMessage(room: string, message: string) {
    this.socket?.emit('message', { room, message });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new SocketService();
