const redis = require('redis');
const logger = require('../utils/logger');

// Configuración para Redis - soporte para Upstash REST API y Redis local
const createRedisClient = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  // Si es Upstash REST API (HTTPS), usar configuración especial
  if (redisUrl.startsWith('https://') && redisUrl.includes('upstash.io')) {
    logger.info('🔄 Configurando cliente Redis para Upstash REST API');
    
    // Para Upstash REST API, usamos un cliente personalizado
    return {
      isUpstashRest: true,
      restUrl: redisUrl,
      restToken: process.env.UPSTASH_REDIS_REST_TOKEN,
      isOpen: true,
      connect: async () => { return Promise.resolve(); },
      disconnect: async () => { return Promise.resolve(); },
      
      // Métodos HTTP para Upstash REST API
      set: async (key, value, options = {}) => {
        try {
          const command = ['SET', key, JSON.stringify(value)];
          if (options.EX) command.push('EX', options.EX);
          
          const response = await fetch(`${redisUrl}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(command)
          });
          
          if (response.ok) {
            logger.debug(`Redis SET: ${key}`);
            return 'OK';
          }
          throw new Error(`HTTP ${response.status}`);
        } catch (error) {
          logger.error('Redis SET error:', error);
          return null;
        }
      },
      
      get: async (key) => {
        try {
          const response = await fetch(`${redisUrl}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(['GET', key])
          });
          
          if (response.ok) {
            const result = await response.json();
            logger.debug(`Redis GET: ${key}`);
            return result.result ? JSON.parse(result.result) : null;
          }
          throw new Error(`HTTP ${response.status}`);
        } catch (error) {
          logger.error('Redis GET error:', error);
          return null;
        }
      },
      
      del: async (key) => {
        try {
          const response = await fetch(`${redisUrl}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(['DEL', key])
          });
          
          if (response.ok) {
            const result = await response.json();
            logger.debug(`Redis DEL: ${key}`);
            return result.result || 0;
          }
          throw new Error(`HTTP ${response.status}`);
        } catch (error) {
          logger.error('Redis DEL error:', error);
          return 0;
        }
      },
      
      exists: async (key) => {
        try {
          const response = await fetch(`${redisUrl}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(['EXISTS', key])
          });
          
          if (response.ok) {
            const result = await response.json();
            logger.debug(`Redis EXISTS: ${key}`);
            return result.result || 0;
          }
          throw new Error(`HTTP ${response.status}`);
        } catch (error) {
          logger.error('Redis EXISTS error:', error);
          return 0;
        }
      },
      
      expire: async (key, seconds) => {
        try {
          const response = await fetch(`${redisUrl}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(['EXPIRE', key, seconds])
          });
          
          if (response.ok) {
            const result = await response.json();
            logger.debug(`Redis EXPIRE: ${key} (${seconds}s)`);
            return result.result || 0;
          }
          throw new Error(`HTTP ${response.status}`);
        } catch (error) {
          logger.error('Redis EXPIRE error:', error);
          return 0;
        }
      }
    };
  }
  
  // Cliente Redis tradicional para conexiones TCP
  const clientOptions = {
    url: redisUrl,
  };

  // Si es Upstash TCP o URL con SSL, configurar SSL
  if (redisUrl.includes('upstash.io') || redisUrl.startsWith('rediss://')) {
    clientOptions.socket = {
      tls: true,
      rejectUnauthorized: false
    };
  }

  // Configurar retry strategy
  clientOptions.retry_strategy = (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      logger.error('Redis server is refusing connections');
      return new Error('Redis server is refusing connections');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      logger.error('Redis retry time exhausted');
      return new Error('Redis retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  };

  const client = redis.createClient(clientOptions);

  client.on('connect', () => {
    logger.info('Redis client connected');
  });

  client.on('ready', () => {
    logger.info('Redis client ready');
  });

  client.on('error', (err) => {
    logger.error('Redis client error:', err);
  });

  client.on('end', () => {
    logger.info('Redis client connection ended');
  });

  return client;
};

const client = createRedisClient();

// Conectar al cliente
const connectRedis = async () => {
  try {
    if (!client.isOpen) {
      await client.connect();
      logger.info('Redis connected successfully');
    }
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    // En desarrollo, no fallar si Redis no está disponible
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('Redis connection failed, but continuing in development mode');
    } else {
      throw error;
    }
  }
};

// Funciones de utilidad
const redisUtils = {
  set: async (key, value, options = {}) => {
    try {
      if (client.isOpen) {
        return await client.set(key, JSON.stringify(value), options);
      }
    } catch (error) {
      logger.error('Redis SET error:', error);
    }
    return null;
  },

  get: async (key) => {
    try {
      if (client.isOpen) {
        const value = await client.get(key);
        return value ? JSON.parse(value) : null;
      }
    } catch (error) {
      logger.error('Redis GET error:', error);
    }
    return null;
  },

  del: async (key) => {
    try {
      if (client.isOpen) {
        return await client.del(key);
      }
    } catch (error) {
      logger.error('Redis DEL error:', error);
    }
    return 0;
  },

  exists: async (key) => {
    try {
      if (client.isOpen) {
        return await client.exists(key);
      }
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
    }
    return 0;
  },

  expire: async (key, seconds) => {
    try {
      if (client.isOpen) {
        return await client.expire(key, seconds);
      }
    } catch (error) {
      logger.error('Redis EXPIRE error:', error);
    }
    return 0;
  }
};

module.exports = {
  client,
  connectRedis,
  ...redisUtils
};