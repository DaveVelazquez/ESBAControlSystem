#!/usr/bin/env node

/**
 * Script de configuración rápida para bases de datos gratuitas
 * 
 * Este script guía al usuario a través del proceso de configuración
 * de Supabase (PostgreSQL) y Upstash (Redis) para el sistema de
 * monitoreo de técnicos en campo.
 */

const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(colors[color] + message + colors.reset);
};

const banner = () => {
  console.clear();
  log('╔══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║              🚀 FIELD SERVICE - CONFIGURACIÓN RÁPIDA            ║', 'cyan');
  log('║                     Bases de Datos Gratuitas                    ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════╝', 'cyan');
  console.log();
};

const setupSupabase = async () => {
  log('📊 CONFIGURACIÓN DE SUPABASE (PostgreSQL)', 'blue');
  log('═══════════════════════════════════════════', 'blue');
  console.log();
  
  log('1. Ir a: https://supabase.com', 'yellow');
  log('2. Crear cuenta gratuita', 'yellow');
  log('3. Crear nuevo proyecto:', 'yellow');
  log('   - Nombre: field-service-db', 'yellow');
  log('   - Contraseña: Generar una segura', 'yellow');
  log('   - Región: Seleccionar la más cercana', 'yellow');
  console.log();
  
  await question('Presiona ENTER cuando hayas creado el proyecto...');
  console.log();
  
  const supabaseUrl = await question('🔗 Ingresa la Database URL de Supabase: ');
  
  if (!supabaseUrl.includes('supabase.co')) {
    log('⚠️  La URL no parece ser de Supabase. Verifica que sea correcta.', 'yellow');
  }
  
  return supabaseUrl;
};

const setupUpstash = async () => {
  log('🗄️  CONFIGURACIÓN DE UPSTASH (Redis)', 'blue');
  log('════════════════════════════════════════', 'blue');
  console.log();
  
  log('1. Ir a: https://upstash.com', 'yellow');
  log('2. Crear cuenta gratuita', 'yellow');
  log('3. Crear nueva base de datos Redis:', 'yellow');
  log('   - Nombre: field-service-redis', 'yellow');
  log('   - Región: Seleccionar la más cercana', 'yellow');
  log('   - Tipo: Regional (gratis)', 'yellow');
  console.log();
  
  await question('Presiona ENTER cuando hayas creado la base de datos Redis...');
  console.log();
  
  const redisUrl = await question('🔗 Ingresa la Redis URL de Upstash: ');
  
  if (!redisUrl.includes('upstash.io')) {
    log('⚠️  La URL no parece ser de Upstash. Verifica que sea correcta.', 'yellow');
  }
  
  return redisUrl;
};

const generateEnvFile = async (databaseUrl, redisUrl) => {
  const envPath = path.join(__dirname, '../../../backend/.env');
  
  const envContent = `# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database Configuration - Supabase
DATABASE_URL=${databaseUrl}
DB_SSL=true

# Redis Configuration - Upstash
REDIS_URL=${redisUrl}

# JWT Configuration
JWT_SECRET=${generateJWTSecret()}
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# AWS Configuration (opcional)
AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your-aws-access-key
# AWS_SECRET_ACCESS_KEY=your-aws-secret-key
# S3_BUCKET=field-service-evidences

# Mapbox Configuration (opcional)
# MAPBOX_ACCESS_TOKEN=your-mapbox-access-token

# Firebase Configuration (opcional para notificaciones push)
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_CLIENT_EMAIL=your-client-email
# FIREBASE_PRIVATE_KEY=your-private-key
# FIREBASE_SERVER_KEY=your-server-key

# CORS Configuration
CORS_ORIGIN=http://localhost:3001,http://localhost:19006

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# SLA Configuration (minutes)
DEFAULT_SLA_MINUTES=240
SLA_WARNING_THRESHOLD=0.8
SLA_CRITICAL_THRESHOLD=0.95

# Geolocation
MAX_CHECK_IN_DISTANCE_METERS=100
LOCATION_PING_INTERVAL_SECONDS=120
`;

  await fs.writeFile(envPath, envContent);
  log(`✅ Archivo .env creado en: ${envPath}`, 'green');
};

const generateJWTSecret = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const showNextSteps = () => {
  log('🎉 CONFIGURACIÓN COMPLETADA', 'green');
  log('═══════════════════════════════', 'green');
  console.log();
  
  log('Próximos pasos:', 'bright');
  console.log();
  log('1. 📊 Inicializar base de datos:', 'yellow');
  log('   cd backend', 'cyan');
  log('   npm install', 'cyan');
  log('   npm run supabase:init', 'cyan');
  console.log();
  
  log('2. 🧪 Probar conexiones:', 'yellow');
  log('   npm run db:test', 'cyan');
  console.log();
  
  log('3. 🚀 Iniciar servidor:', 'yellow');
  log('   npm run dev', 'cyan');
  console.log();
  
  log('4. 🌐 Acceder a la aplicación:', 'yellow');
  log('   Backend: http://localhost:3000', 'cyan');
  log('   Usuario admin: admin@fieldservice.com', 'cyan');
  log('   Contraseña: admin123', 'cyan');
  console.log();
  
  log('⚠️  IMPORTANTE:', 'red');
  log('   - Cambiar la contraseña del admin en producción', 'red');
  log('   - Configurar AWS S3 para subida de evidencias', 'red');
  log('   - Obtener token de Mapbox para mapas', 'red');
  console.log();
  
  log('📚 Documentación adicional:', 'blue');
  log('   - CONFIGURACION_BASES_DATOS_GRATUITAS.md', 'cyan');
  log('   - CONFIGURACION_GRATUITA.md', 'cyan');
};

const main = async () => {
  try {
    banner();
    
    log('Este asistente te ayudará a configurar las bases de datos gratuitas', 'bright');
    log('para el Sistema de Monitoreo de Técnicos en Campo.', 'bright');
    console.log();
    
    const proceed = await question('¿Deseas continuar? (s/n): ');
    
    if (proceed.toLowerCase() !== 's' && proceed.toLowerCase() !== 'si') {
      log('Configuración cancelada.', 'yellow');
      rl.close();
      return;
    }
    
    console.log();
    
    // Configurar Supabase
    const databaseUrl = await setupSupabase();
    console.log();
    
    // Configurar Upstash
    const redisUrl = await setupUpstash();
    console.log();
    
    // Generar archivo .env
    log('📝 Generando archivo de configuración...', 'blue');
    await generateEnvFile(databaseUrl, redisUrl);
    console.log();
    
    // Mostrar próximos pasos
    showNextSteps();
    
  } catch (error) {
    log(`💥 Error durante la configuración: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    rl.close();
  }
};

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { main };