const { Pool } = require('pg');
const logger = require('../utils/logger');

// Configuración optimizada para Supabase y PostgreSQL local
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase.co') ? {
    rejectUnauthorized: false
  } : (process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false),
  max: process.env.NODE_ENV === 'production' ? 10 : 5, // Menor pool para Supabase free tier
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Más tiempo para conexiones remotas
  acquireTimeoutMillis: 60000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200
});

pool.on('connect', () => {
  logger.info('Database connected');
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool
};
