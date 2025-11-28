#!/usr/bin/env node

// Probador simple de conexiones sin dependencias
const fs = require('fs');
const path = require('path');

console.log('🧪 PROBADOR SIMPLE DE CONFIGURACIÓN');
console.log('=====================================\n');

// Leer archivo .env
const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.log('❌ Archivo .env no encontrado');
  console.log('   Crear archivo .env basado en .env.template-gratuito');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

// Parsear archivo .env
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      envVars[key.trim()] = values.join('=').trim();
    }
  }
});

console.log('📋 Variables de entorno encontradas:');
console.log('====================================');

// Verificar variables críticas
const criticalVars = [
  'NODE_ENV',
  'PORT', 
  'DATABASE_URL',
  'JWT_SECRET'
];

const optionalVars = [
  'REDIS_URL',
  'AWS_REGION',
  'MAPBOX_ACCESS_TOKEN'
];

criticalVars.forEach(varName => {
  if (envVars[varName]) {
    console.log(`✅ ${varName}: Configurado`);
  } else {
    console.log(`❌ ${varName}: FALTANTE (requerido)`);
  }
});

console.log('\n📋 Variables opcionales:');
optionalVars.forEach(varName => {
  if (envVars[varName] && !envVars[varName].startsWith('tu-') && !envVars[varName].startsWith('TU_')) {
    console.log(`✅ ${varName}: Configurado`);
  } else {
    console.log(`⚪ ${varName}: No configurado (opcional)`);
  }
});

// Detectar tipo de bases de datos
console.log('\n🏗️ Tipo de deployment detectado:');
const dbUrl = envVars.DATABASE_URL || '';
const redisUrl = envVars.REDIS_URL || '';

if (dbUrl.includes('supabase.co')) {
  console.log('📊 PostgreSQL: Supabase (gratuito) ✅');
} else if (dbUrl.includes('localhost')) {
  console.log('📊 PostgreSQL: Local');
} else if (dbUrl.startsWith('postgresql://postgres:TU_')) {
  console.log('📊 PostgreSQL: ⚠️ NECESITA CONFIGURACIÓN - Reemplazar URL de Supabase');
} else {
  console.log('📊 PostgreSQL: Otro proveedor');
}

if (redisUrl.includes('upstash.io')) {
  console.log('🗄️ Redis: Upstash (gratuito) ✅');
} else if (redisUrl.includes('localhost')) {
  console.log('🗄️ Redis: Local');
} else if (redisUrl.startsWith('redis://default:TU_')) {
  console.log('🗄️ Redis: ⚠️ NECESITA CONFIGURACIÓN - Reemplazar URL de Upstash');
} else if (redisUrl) {
  console.log('🗄️ Redis: Otro proveedor');
} else {
  console.log('🗄️ Redis: No configurado');
}

console.log('\n💡 Próximos pasos:');
if (dbUrl.includes('TU_PASSWORD') || redisUrl.includes('TU_PASSWORD')) {
  console.log('1. ⚠️ Configurar URLs reales de Supabase y Upstash en .env');
  console.log('2. 🧪 Ejecutar: node check-config.js');
  console.log('3. 🚀 Intentar: npm install (si funciona Node.js)');
} else {
  console.log('1. ✅ Configuración básica completa');
  console.log('2. 🚀 Instalar dependencias: npm install');
  console.log('3. 🏃 Iniciar servidor: npm run dev');
}

console.log('\n📚 Documentación:');
console.log('   CONFIGURACION_BASES_DATOS_GRATUITAS.md');
console.log('   ACTUALIZACION_BASES_DATOS_GRATUITAS.md');