import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';

// Store
import { store } from '@/store';

// Theme
import theme from '@/theme';

// Components
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';

// Pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';

// Lazy loaded pages (will be created)
const Orders = React.lazy(() => import('@/pages/Orders'));
const Technicians = React.lazy(() => import('@/pages/Technicians'));
const Tracking = React.lazy(() => import('@/pages/Tracking'));
const Reports = React.lazy(() => import('@/pages/Reports'));
const ClientsList = React.lazy(() => import('@/pages/Clients/ClientsList'));
const ClientDetail = React.lazy(() => import('@/pages/Clients/ClientDetail'));

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          autoHideDuration={3000}
        >
          <HashRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />

              {/* Private routes */}
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  <Route
                    path="/orders"
                    element={
                      <React.Suspense fallback={<div>Cargando...</div>}>
                        <Orders />
                      </React.Suspense>
                    }
                  />
                  
                  <Route
                    path="/technicians"
                    element={
                      <React.Suspense fallback={<div>Cargando...</div>}>
                        <Technicians />
                      </React.Suspense>
                    }
                  />
                  
                  <Route
                    path="/tracking"
                    element={
                      <React.Suspense fallback={<div>Cargando...</div>}>
                        <Tracking />
                      </React.Suspense>
                    }
                  />
                  
                  <Route
                    path="/reports"
                    element={
                      <React.Suspense fallback={<div>Cargando...</div>}>
                        <Reports />
                      </React.Suspense>
                    }
                  />
                  
                  <Route
                    path="/clients"
                    element={
                      <React.Suspense fallback={<div>Cargando...</div>}>
                        <ClientsList />
                      </React.Suspense>
                    }
                  />
                  
                  <Route
                    path="/clients/:id"
                    element={
                      <React.Suspense fallback={<div>Cargando...</div>}>
                        <ClientDetail />
                      </React.Suspense>
                    }
                  />
                </Route>
              </Route>

              {/* 404 */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </HashRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
