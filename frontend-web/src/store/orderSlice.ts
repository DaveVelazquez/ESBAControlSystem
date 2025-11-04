import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Order, OrderFilters, PaginatedResponse } from '@/types';
import { orderService, CreateOrderData, UpdateOrderData } from '@/services/order.service';

interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: OrderFilters;
}

const initialState: OrderState = {
  orders: [],
  selectedOrder: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  },
  filters: {},
};

// Async thunks
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async ({ filters, page, pageSize }: { filters?: OrderFilters; page?: number; pageSize?: number }, { rejectWithValue }) => {
    try {
      return await orderService.getOrders(filters, page, pageSize);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar órdenes');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await orderService.getOrderById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar orden');
    }
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (data: CreateOrderData, { rejectWithValue }) => {
    try {
      return await orderService.createOrder(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear orden');
    }
  }
);

export const updateOrder = createAsyncThunk(
  'orders/updateOrder',
  async ({ id, data }: { id: string; data: UpdateOrderData }, { rejectWithValue }) => {
    try {
      return await orderService.updateOrder(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar orden');
    }
  }
);

export const assignTechnician = createAsyncThunk(
  'orders/assignTechnician',
  async ({ orderId, technicianId }: { orderId: string; technicianId: string }, { rejectWithValue }) => {
    try {
      return await orderService.assignTechnician(orderId, technicianId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al asignar técnico');
    }
  }
);

export const deleteOrder = createAsyncThunk(
  'orders/deleteOrder',
  async (id: string, { rejectWithValue }) => {
    try {
      await orderService.deleteOrder(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al eliminar orden');
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<OrderFilters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearError: (state) => {
      state.error = null;
    },
    updateOrderInList: (state, action: PayloadAction<Order>) => {
      const index = state.orders.findIndex(o => o.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
      if (state.selectedOrder?.id === action.payload.id) {
        state.selectedOrder = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch orders
    builder.addCase(fetchOrders.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchOrders.fulfilled, (state, action: PayloadAction<PaginatedResponse<Order>>) => {
      state.loading = false;
      state.orders = action.payload.data;
      state.pagination = {
        page: action.payload.page,
        pageSize: action.payload.pageSize,
        total: action.payload.total,
        totalPages: action.payload.totalPages,
      };
    });
    builder.addCase(fetchOrders.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch order by ID
    builder.addCase(fetchOrderById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchOrderById.fulfilled, (state, action: PayloadAction<Order>) => {
      state.loading = false;
      state.selectedOrder = action.payload;
    });
    builder.addCase(fetchOrderById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create order
    builder.addCase(createOrder.fulfilled, (state, action: PayloadAction<Order>) => {
      state.orders.unshift(action.payload);
      state.pagination.total += 1;
    });

    // Update order
    builder.addCase(updateOrder.fulfilled, (state, action: PayloadAction<Order>) => {
      const index = state.orders.findIndex(o => o.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
      if (state.selectedOrder?.id === action.payload.id) {
        state.selectedOrder = action.payload;
      }
    });

    // Assign technician
    builder.addCase(assignTechnician.fulfilled, (state, action: PayloadAction<Order>) => {
      const index = state.orders.findIndex(o => o.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
      if (state.selectedOrder?.id === action.payload.id) {
        state.selectedOrder = action.payload;
      }
    });

    // Delete order
    builder.addCase(deleteOrder.fulfilled, (state, action: PayloadAction<string>) => {
      state.orders = state.orders.filter(o => o.id !== action.payload);
      state.pagination.total -= 1;
      if (state.selectedOrder?.id === action.payload) {
        state.selectedOrder = null;
      }
    });
  },
});

export const { setFilters, clearFilters, clearError, updateOrderInList } = orderSlice.actions;
export default orderSlice.reducer;
