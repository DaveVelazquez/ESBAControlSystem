#!/usr/bin/env node
require('dotenv').config();
const { testConnection, getStats, closePool } = require('../config/database-enhanced');
const { client: redisClient } = require('../config/redis');
const logger = require('../utils/logger');

const testDatabases = async () => {
  console.log('🧪 Probando conexiones de bases de datos...\n');

  // Test PostgreSQL
  console.log('📊 Probando PostgreSQL...');
  const pgOk = await testConnection();
  
  if (pgOk) {
    const stats = await getStats();
    if (stats) {
      console.log(`   📦 Tamaño DB: ${stats.db_size}`);
      console.log(`   🔗 Conexiones: ${stats.active_connections}/${stats.max_connections}`);
    }
    
    // Test básico de consulta
    try {
      const { query } = require('../config/database-enhanced');
      const result = await query('SELECT COUNT(*) as total FROM information_schema.tables WHERE table_schema = $1', ['public']);
      console.log(`   📋 Tablas públicas: ${result.rows[0].total}`);
    } catch (error) {
      console.log(`   ⚠️  Error consultando tablas: ${error.message}`);
    }
  }

  // Test Redis
  console.log('\n🗄️  Probando Redis...');
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    
    // Test básico de Redis
    await redisClient.set('test:connection', 'ok', { EX: 60 });
    const testValue = await redisClient.get('test:connection');
    
    if (testValue === 'ok') {
      console.log('   ✅ Redis connection successful');
      
      // Obtener info de Redis
      const info = await redisClient.info('server');
      const version = info.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown';
      console.log(`   📦 Redis version: ${version}`);
      
      // Obtener estadísticas de memoria
      const memory = await redisClient.info('memory');
      const usedMemory = memory.match(/used_memory_human:([^\r\n]+)/)?.[1] || 'unknown';
      console.log(`   💾 Memoria usada: ${usedMemory}`);
      
      // Limpiar test
      await redisClient.del('test:connection');
    } else {
      console.log('   ❌ Redis test failed - value mismatch');
    }
    
  } catch (error) {
    console.log(`   ❌ Redis connection failed: ${error.message}`);
    
    // Verificar si es un error de configuración común
    if (error.message.includes('ECONNREFUSED')) {
      console.log('   💡 Sugerencia: Verificar que Redis esté ejecutándose');
    } else if (error.message.includes('authentication')) {
      console.log('   💡 Sugerencia: Verificar REDIS_URL y credenciales');
    } else if (error.message.includes('timeout')) {
      console.log('   💡 Sugerencia: Verificar conectividad de red');
    }
  }

  // Test de configuración de entorno
  console.log('\n🔧 Verificando configuración...');
  
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NODE_ENV'
  ];
  
  const optionalVars = [
    'REDIS_URL',
    'AWS_ACCESS_KEY_ID',
    'MAPBOX_ACCESS_TOKEN',
    'FIREBASE_PROJECT_ID'
  ];

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`   ✅ ${varName}: Configurado`);
    } else {
      console.log(`   ❌ ${varName}: FALTANTE (requerido)`);
    }
  });

  console.log('\n📋 Variables opcionales:');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`   ✅ ${varName}: Configurado`);
    } else {
      console.log(`   ⚪ ${varName}: No configurado (opcional)`);
    }
  });

  // Detectar tipo de deployment
  console.log('\n🏗️  Tipo de despliegue detectado:');
  
  const dbUrl = process.env.DATABASE_URL || '';
  const redisUrl = process.env.REDIS_URL || '';
  
  if (dbUrl.includes('supabase.co')) {
    console.log('   📊 PostgreSQL: Supabase (gratuito)');
  } else if (dbUrl.includes('railway.app')) {
    console.log('   📊 PostgreSQL: Railway');
  } else if (dbUrl.includes('amazonaws.com')) {
    console.log('   📊 PostgreSQL: AWS RDS');
  } else if (dbUrl.includes('localhost')) {
    console.log('   📊 PostgreSQL: Local');
  } else {
    console.log('   📊 PostgreSQL: Otro proveedor');
  }
  
  if (redisUrl.includes('upstash.io')) {
    console.log('   🗄️  Redis: Upstash (gratuito)');
  } else if (redisUrl.includes('amazonaws.com')) {
    console.log('   🗄️  Redis: AWS ElastiCache');
  } else if (redisUrl.includes('localhost')) {
    console.log('   🗄️  Redis: Local');
  } else if (redisUrl) {
    console.log('   🗄️  Redis: Otro proveedor');
  } else {
    console.log('   🗄️  Redis: No configurado');
  }

  console.log('\n🏁 Prueba de bases de datos completada');
  
  // Cleanup
  try {
    if (redisClient.isOpen) {
      await redisClient.disconnect();
    }
  } catch (error) {
    // Ignorar errores de desconexión
  }
  
  await closePool();
};

// Ejecutar si se llama directamente
if (require.main === module) {
  testDatabases().catch((error) => {
    console.error('💥 Error probando bases de datos:', error);
    process.exit(1);
  });
}

module.exports = { testDatabases };