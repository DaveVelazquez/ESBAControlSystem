require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const socketIo = require('socket.io');

// Try to initialize Redis connection (optional)
let connectRedis = null;
try {
  connectRedis = require('./config/redis').connectRedis;
} catch (err) {
  console.warn('⚠️  Redis not available, running without cache');
}

// Import routes
const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const techniciansRoutes = require('./routes/technicians');
const checkInRoutes = require('./routes/checkin');
const evidencesRoutes = require('./routes/evidences');
const reportsRoutes = require('./routes/reports');
const locationsRoutes = require('./routes/locations');
const clientsRoutes = require('./routes/clients');

// Import middleware (make optional)
let errorHandler, rateLimiter, logger;
try {
  errorHandler = require('./middleware/errorHandler').errorHandler;
  rateLimiter = require('./middleware/rateLimiter').rateLimiter;
  logger = require('./utils/logger');
} catch (err) {
  console.warn('⚠️  Some middleware not available, using fallback');
  errorHandler = (err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  };
  rateLimiter = (req, res, next) => next();
  logger = console;
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST']
  }
});

// Make io accessible to routes
app.set('io', io);

// Trust proxy - needed when behind nginx reverse proxy
app.set('trust proxy', true);

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/technicians', techniciansRoutes);
app.use('/api/orders', checkInRoutes);
app.use('/api/orders', evidencesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/clients', clientsRoutes);

// API Documentation
app.get('/api', (req, res) => {
  res.json({
    message: 'Field Service API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      orders: '/api/orders',
      technicians: '/api/technicians',
      reports: '/api/reports',
      locations: '/api/locations'
    },
    documentation: '/api-docs'
  });
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  logger.info(`New socket connection: ${socket.id}`);
  
  socket.on('join-order', (orderId) => {
    socket.join(`order-${orderId}`);
    logger.info(`Socket ${socket.id} joined order-${orderId}`);
  });

  socket.on('join-dispatcher', (dispatcherId) => {
    socket.join(`dispatcher-${dispatcherId}`);
    logger.info(`Socket ${socket.id} joined dispatcher-${dispatcherId}`);
  });

  socket.on('location-update', (data) => {
    io.to(`dispatcher-${data.dispatcherId}`).emit('technician-location', data);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl 
  });
});

// Initialize connections
const initializeServer = async () => {
  try {
    // Connect to Redis (if available)
    if (connectRedis) {
      await connectRedis();
      logger.info('✅ Redis connection initialized');
    } else {
      logger.info('⚠️  Running without Redis cache');
    }
  } catch (error) {
    logger.warn('⚠️  Redis connection failed, continuing without cache:', error.message);
  }

  // Start server
  const PORT = process.env.PORT || 3000;
  const HOST = process.env.HOST || '0.0.0.0';

  server.listen(PORT, HOST, () => {
    logger.info(`🚀 Server running on http://${HOST}:${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`💾 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
    logger.info(`🗄️  Redis: ${process.env.REDIS_URL ? 'Configured' : 'Not configured'}`);
  });
};

// Initialize server
initializeServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
