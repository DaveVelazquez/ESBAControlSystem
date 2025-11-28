#!/usr/bin/env node
require('dotenv').config();
const { testConnection, runBasicMigrations, getStats, closePool } = require('../config/database-enhanced');
const logger = require('../utils/logger');

const setupDatabase = async () => {
  console.log('🚀 Iniciando configuración de base de datos...\n');

  // Paso 1: Probar conexión
  console.log('📡 Probando conexión a la base de datos...');
  const connectionOk = await testConnection();
  
  if (!connectionOk) {
    console.error('❌ No se pudo conectar a la base de datos');
    console.error('💡 Verifica que DATABASE_URL esté configurado correctamente');
    process.exit(1);
  }

  // Paso 2: Ejecutar migraciones básicas
  console.log('\n🔧 Ejecutando migraciones básicas...');
  const migrationsOk = await runBasicMigrations();
  
  if (!migrationsOk) {
    console.error('❌ Error ejecutando migraciones básicas');
    process.exit(1);
  }

  // Paso 3: Mostrar estadísticas
  console.log('\n📊 Obteniendo estadísticas de la base de datos...');
  const stats = await getStats();
  
  if (stats) {
    console.log(`📦 Tamaño de la base de datos: ${stats.db_size}`);
    console.log(`🔗 Conexiones activas: ${stats.active_connections}/${stats.max_connections}`);
  }

  console.log('\n✅ Configuración de base de datos completada');
  console.log('\n💡 Próximos pasos:');
  console.log('   1. Ejecutar: npm run supabase:init (si usas Supabase)');
  console.log('   2. Ejecutar: npm run dev (para iniciar el servidor)');
  
  await closePool();
};

// Ejecutar si se llama directamente
if (require.main === module) {
  setupDatabase().catch((error) => {
    console.error('💥 Error configurando base de datos:', error);
    process.exit(1);
  });
}

module.exports = { setupDatabase };