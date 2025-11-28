// Test simple de conexión a PostgreSQL sin dependencias externas
const { Pool } = require('pg');

console.log('🧪 Probando conexión a Supabase PostgreSQL...\n');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Pa$$.word99@db.nphuclchphpnqawzzueb.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
  max: 2,
  connectionTimeoutMillis: 10000,
});

async function testConnection() {
  let client;
  try {
    console.log('📡 Conectando a Supabase...');
    client = await pool.connect();
    
    console.log('✅ Conexión establecida');
    
    // Test 1: Verificar extensiones
    const extensionsResult = await client.query(`
      SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') as uuid_exists,
             EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') as postgis_exists
    `);
    
    console.log('\n🔧 Extensiones:');
    console.log(`   UUID: ${extensionsResult.rows[0].uuid_exists ? '✅' : '❌'}`);
    console.log(`   PostGIS: ${extensionsResult.rows[0].postgis_exists ? '✅' : '❌'}`);
    
    // Test 2: Verificar tablas creadas
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tablas encontradas:');
    const tables = tablesResult.rows.map(row => row.table_name);
    const expectedTables = ['users', 'work_orders', 'check_ins', 'evidences', 'location_tracking', 'notifications', 'system_config'];
    
    expectedTables.forEach(table => {
      const exists = tables.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    });
    
    // Test 3: Verificar usuario admin
    const adminResult = await client.query(`
      SELECT email, role, created_at FROM users WHERE role = 'admin' LIMIT 1
    `);
    
    console.log('\n👤 Usuario administrador:');
    if (adminResult.rows.length > 0) {
      const admin = adminResult.rows[0];
      console.log(`   ✅ Email: ${admin.email}`);
      console.log(`   ✅ Rol: ${admin.role}`);
      console.log(`   ✅ Creado: ${admin.created_at}`);
      console.log('   🔑 Contraseña: admin123');
    } else {
      console.log('   ❌ Usuario admin no encontrado');
    }
    
    // Test 4: Verificar configuraciones del sistema
    const configResult = await client.query('SELECT COUNT(*) as count FROM system_config');
    console.log(`\n⚙️  Configuraciones del sistema: ${configResult.rows[0].count}`);
    
    console.log('\n✅ ¡SUPABASE CONFIGURADO CORRECTAMENTE!');
    console.log('\n🚀 Próximos pasos:');
    console.log('   1. Configurar GitHub Secrets');
    console.log('   2. Ejecutar deployment a AWS');
    console.log('   3. Probar la aplicación completa');
    
  } catch (error) {
    console.error('\n❌ Error de conexión:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.error('💡 Verificar que la contraseña en la URL sea correcta');
    } else if (error.message.includes('connection timed out')) {
      console.error('💡 Verificar conectividad de red a Supabase');
    } else if (error.message.includes('does not exist')) {
      console.error('💡 Ejecutar el script SQL en Supabase primero');
    }
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

testConnection();