const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Ultra-permissive CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'],
  credentials: false
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Detailed logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  const response = {
    status: 'OK',
    message: 'Ultra-simple backend is running!',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: 'production'
  };
  console.log('[HEALTH] Responding with:', response);
  res.status(200).json(response);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Field Service Manager API - Ultra Simple Version',
    version: '1.0.0',
    endpoints: ['/health', '/api/auth/login'],
    timestamp: new Date().toISOString()
  });
});

// THE CRITICAL LOGIN ENDPOINT
app.post('/api/auth/login', (req, res) => {
  console.log('\n=== LOGIN ATTEMPT ===');
  console.log('Time:', new Date().toISOString());
  console.log('Body received:', req.body);
  console.log('Email:', req.body.email);
  console.log('Password:', req.body.password);
  
  const { email, password } = req.body;
  
  // Hardcoded login check
  if (email === 'admin@fieldservice.com' && password === 'admin123') {
    const successResponse = {
      success: true,
      message: 'Login successful!',
      token: 'simple-jwt-' + Date.now(),
      user: {
        id: 1,
        email: 'admin@fieldservice.com',
        name: 'System Administrator',
        role: 'admin'
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ LOGIN SUCCESS - Responding with:', successResponse);
    return res.status(200).json(successResponse);
  } else {
    const errorResponse = {
      success: false,
      message: 'Invalid email or password',
      timestamp: new Date().toISOString(),
      received: { email, password }
    };
    
    console.log('❌ LOGIN FAILED - Responding with:', errorResponse);
    return res.status(401).json(errorResponse);
  }
});

// Catch all other routes
app.use('*', (req, res) => {
  console.log(`404 - Unknown route: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 ===== ULTRA-SIMPLE BACKEND STARTED =====');
  console.log(`⚡ Server: http://0.0.0.0:${PORT}`);
  console.log(`💚 Health: http://0.0.0.0:${PORT}/health`);
  console.log(`🔐 Login: POST http://0.0.0.0:${PORT}/api/auth/login`);
  console.log('📧 Email: admin@fieldservice.com');
  console.log('🔑 Password: admin123');
  console.log('============================================\n');
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
