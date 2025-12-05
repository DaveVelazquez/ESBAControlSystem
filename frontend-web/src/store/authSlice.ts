import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '@/types';
import { authService, LoginCredentials, RegisterData } from '@/services/auth.service';
import socketService from '@/services/socket';

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      console.log('🔐 [AUTH] Intentando login con:', { email: credentials.email });
      console.log('🌐 [AUTH] API URL:', import.meta.env.VITE_API_URL);
      
      const { user, token } = await authService.login(credentials);
      
      console.log('✅ [AUTH] Login exitoso:', { user, tokenLength: token.length });
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Connect socket
      socketService.connect(token);
      
      return { user, token };
    } catch (error: any) {
      console.error('❌ [AUTH] Error en login:', error);
      console.error('❌ [AUTH] Response data:', error.response?.data);
      console.error('❌ [AUTH] Status:', error.response?.status);
      return rejectWithValue(error.response?.data?.message || 'Error al iniciar sesión');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterData, { rejectWithValue }) => {
    try {
      const { user, token } = await authService.register(data);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      socketService.connect(token);
      
      return { user, token };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al registrarse');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
  socketService.disconnect();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
});

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al obtener usuario');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Register
    builder.addCase(register.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    });

    // Get current user
    builder.addCase(getCurrentUser.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getCurrentUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
    });
    builder.addCase(getCurrentUser.rejected, (state) => {
      state.loading = false;
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
