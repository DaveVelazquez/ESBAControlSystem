#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { query, closePool } = require('../config/database-enhanced');
const logger = require('../utils/logger');

const initSupabase = async () => {
  console.log('🦄 Inicializando base de datos Supabase...\n');

  try {
    // Leer el archivo SQL de inicialización
    const sqlPath = path.join(__dirname, '../../database/supabase-init.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');

    console.log('📄 Archivo SQL leído correctamente');
    console.log('🔧 Ejecutando script de inicialización...');

    // Dividir el SQL en statements individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Ejecutando ${statements.length} declaraciones SQL...`);

    let executed = 0;
    let errors = 0;

    for (const statement of statements) {
      try {
        if (statement.trim()) {
          await query(statement);
          executed++;
          
          // Mostrar progreso cada 10 statements
          if (executed % 10 === 0) {
            console.log(`✅ Ejecutadas ${executed}/${statements.length} declaraciones`);
          }
        }
      } catch (error) {
        errors++;
        
        // Ignorar algunos errores comunes que no son críticos
        const ignorableErrors = [
          'already exists',
          'duplicate key',
          'does not exist',
          'permission denied for relation'
        ];
        
        const isIgnorable = ignorableErrors.some(err => 
          error.message.toLowerCase().includes(err)
        );

        if (isIgnorable) {
          console.log(`⚠️  Advertencia ignorada: ${error.message.split('\n')[0]}`);
        } else {
          console.error(`❌ Error en statement: ${statement.substring(0, 100)}...`);
          console.error(`   Mensaje: ${error.message}`);
        }
      }
    }

    console.log(`\n📊 Resumen de ejecución:`);
    console.log(`   ✅ Exitosas: ${executed - errors}`);
    console.log(`   ⚠️  Errores/Advertencias: ${errors}`);

    // Verificar que las tablas principales se crearon
    console.log('\n🔍 Verificando tablas creadas...');
    
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = tablesResult.rows.map(row => row.table_name);
    
    const expectedTables = [
      'users', 
      'work_orders', 
      'check_ins', 
      'evidences', 
      'location_tracking', 
      'notifications', 
      'system_config'
    ];

    console.log('📋 Tablas encontradas:');
    tables.forEach(table => {
      const isExpected = expectedTables.includes(table);
      console.log(`   ${isExpected ? '✅' : '📄'} ${table}`);
    });

    const missingTables = expectedTables.filter(table => !tables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('\n⚠️  Tablas faltantes:');
      missingTables.forEach(table => console.log(`   ❌ ${table}`));
    }

    // Verificar datos iniciales
    console.log('\n🔍 Verificando datos iniciales...');
    
    try {
      const configCount = await query('SELECT COUNT(*) FROM system_config');
      console.log(`📋 Configuraciones del sistema: ${configCount.rows[0].count}`);
      
      const userCount = await query('SELECT COUNT(*) FROM users WHERE role = $1', ['admin']);
      console.log(`👤 Usuarios administradores: ${userCount.rows[0].count}`);
      
      if (userCount.rows[0].count > 0) {
        console.log('   📧 Usuario admin disponible: admin@fieldservice.com');
        console.log('   🔑 Contraseña por defecto: admin123');
        console.log('   ⚠️  IMPORTANTE: Cambiar la contraseña en producción');
      }
      
    } catch (error) {
      console.log('⚠️  No se pudieron verificar los datos iniciales');
    }

    console.log('\n✅ Inicialización de Supabase completada');
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Verificar en el dashboard de Supabase que las tablas se crearon');
    console.log('   2. Configurar RLS (Row Level Security) si es necesario');
    console.log('   3. Configurar las políticas de acceso específicas para tu aplicación');
    console.log('   4. Ejecutar: npm run dev (para probar la conexión)');

  } catch (error) {
    console.error('💥 Error durante la inicialización:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  initSupabase().catch((error) => {
    console.error('💥 Error inicializando Supabase:', error);
    process.exit(1);
  });
}

module.exports = { initSupabase };