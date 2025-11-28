const { Pool } = require('pg');
const logger = require('../utils/logger');

// Configuración de conexión para diferentes entornos
const getDatabaseConfig = () => {
  const config = {
    connectionString: process.env.DATABASE_URL,
    max: process.env.NODE_ENV === 'production' ? 10 : 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200
  };

  // Configurar SSL automáticamente para servicios conocidos
  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL;
    
    // Supabase requiere SSL
    if (url.includes('supabase.co')) {
      config.ssl = { rejectUnauthorized: false };
      logger.info('🔒 SSL enabled for Supabase connection');
    }
    // Railway requiere SSL
    else if (url.includes('railway.app')) {
      config.ssl = { rejectUnauthorized: false };
      logger.info('🔒 SSL enabled for Railway connection');
    }
    // Heroku requiere SSL
    else if (url.includes('amazonaws.com') || url.includes('heroku')) {
      config.ssl = { rejectUnauthorized: false };
      logger.info('🔒 SSL enabled for cloud provider');
    }
    // SSL manual mediante variable de entorno
    else if (process.env.DB_SSL === 'true') {
      config.ssl = { rejectUnauthorized: false };
      logger.info('🔒 SSL enabled via DB_SSL flag');
    }
    // Desarrollo local - no SSL
    else if (url.includes('localhost') || url.includes('127.0.0.1')) {
      config.ssl = false;
      logger.info('🔓 SSL disabled for local development');
    }
  }

  return config;
};

// Crear pool de conexiones
const pool = new Pool(getDatabaseConfig());

// Event handlers para el pool
pool.on('connect', (client) => {
  logger.debug('📡 New database client connected');
  
  // Configurar timezone para el cliente
  client.query('SET timezone = "UTC"');
});

pool.on('acquire', () => {
  logger.debug('📊 Database client acquired from pool');
});

pool.on('remove', () => {
  logger.debug('📉 Database client removed from pool');
});

pool.on('error', (err) => {
  logger.error('💥 Unexpected database pool error:', err);
  
  // No terminar el proceso en desarrollo
  if (process.env.NODE_ENV === 'production') {
    process.exit(-1);
  }
});

// Función para verificar la conexión
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    client.release();
    
    logger.info('✅ Database connection successful');
    logger.info(`📅 Server time: ${result.rows[0].current_time}`);
    logger.info(`📦 PostgreSQL version: ${result.rows[0].postgres_version.split(' ')[0]}`);
    
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Función para ejecutar migraciones básicas
const runBasicMigrations = async () => {
  try {
    const client = await pool.connect();
    
    // Verificar si las extensiones están disponibles
    const extensionsQuery = `
      SELECT EXISTS (
        SELECT 1 FROM pg_available_extensions WHERE name = 'uuid-ossp'
      ) as uuid_available,
      EXISTS (
        SELECT 1 FROM pg_available_extensions WHERE name = 'postgis'
      ) as postgis_available;
    `;
    
    const extensionsResult = await client.query(extensionsQuery);
    const extensions = extensionsResult.rows[0];
    
    if (extensions.uuid_available) {
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      logger.info('✅ UUID extension enabled');
    }
    
    if (extensions.postgis_available) {
      await client.query('CREATE EXTENSION IF NOT EXISTS "postgis"');
      logger.info('✅ PostGIS extension enabled');
    } else {
      logger.warn('⚠️  PostGIS not available, geographic features may be limited');
    }
    
    client.release();
    return true;
  } catch (error) {
    logger.error('❌ Migration failed:', error.message);
    return false;
  }
};

// Funciones de utilidad para consultas
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug(`📝 Query executed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`❌ Query failed after ${duration}ms:`, error.message);
    throw error;
  }
};

const getClient = async () => {
  try {
    return await pool.connect();
  } catch (error) {
    logger.error('❌ Failed to get database client:', error.message);
    throw error;
  }
};

// Función para transacciones
const withTransaction = async (callback) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Función para obtener estadísticas de la base de datos
const getStats = async () => {
  try {
    const stats = await query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as db_size,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
        (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections;
    `);
    
    return stats.rows[0];
  } catch (error) {
    logger.error('❌ Failed to get database stats:', error.message);
    return null;
  }
};

// Graceful shutdown
const closePool = async () => {
  try {
    await pool.end();
    logger.info('📪 Database pool closed gracefully');
  } catch (error) {
    logger.error('❌ Error closing database pool:', error.message);
  }
};

// Manejar señales de terminación
process.on('SIGTERM', closePool);
process.on('SIGINT', closePool);

module.exports = {
  query,
  getClient,
  withTransaction,
  testConnection,
  runBasicMigrations,
  getStats,
  closePool,
  pool
};