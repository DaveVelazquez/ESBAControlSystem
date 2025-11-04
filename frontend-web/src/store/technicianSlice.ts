import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { TechnicianProfile, TechnicianLocation } from '@/types';
import { technicianService } from '@/services/technician.service';

interface TechnicianState {
  technicians: TechnicianProfile[];
  locations: Record<string, TechnicianLocation>;
  loading: boolean;
  error: string | null;
}

const initialState: TechnicianState = {
  technicians: [],
  locations: {},
  loading: false,
  error: null,
};

// Async thunks
export const fetchTechnicians = createAsyncThunk(
  'technicians/fetchTechnicians',
  async (_, { rejectWithValue }) => {
    try {
      return await technicianService.getTechnicians();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar técnicos');
    }
  }
);

export const fetchAllLocations = createAsyncThunk(
  'technicians/fetchAllLocations',
  async (_, { rejectWithValue }) => {
    try {
      return await technicianService.getAllTechnicianLocations();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar ubicaciones');
    }
  }
);

const technicianSlice = createSlice({
  name: 'technicians',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateLocation: (state, action: PayloadAction<TechnicianLocation>) => {
      state.locations[action.payload.technicianId] = action.payload;
      
      // Update technician's current position
      const tech = state.technicians.find(t => t.id === action.payload.technicianId);
      if (tech) {
        tech.currentLatitude = action.payload.latitude;
        tech.currentLongitude = action.payload.longitude;
        tech.lastSeen = action.payload.timestamp;
      }
    },
    updateTechnicianStatus: (state, action: PayloadAction<{ id: string; status: 'available' | 'busy' | 'offline' }>) => {
      const tech = state.technicians.find(t => t.id === action.payload.id);
      if (tech) {
        tech.status = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch technicians
    builder.addCase(fetchTechnicians.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTechnicians.fulfilled, (state, action: PayloadAction<TechnicianProfile[]>) => {
      state.loading = false;
      state.technicians = action.payload;
    });
    builder.addCase(fetchTechnicians.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch all locations
    builder.addCase(fetchAllLocations.fulfilled, (state, action: PayloadAction<TechnicianLocation[]>) => {
      action.payload.forEach(location => {
        state.locations[location.technicianId] = location;
      });
    });
  },
});

export const { clearError, updateLocation, updateTechnicianStatus } = technicianSlice.actions;
export default technicianSlice.reducer;
