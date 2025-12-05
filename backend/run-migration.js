#!/usr/bin/env node

/**
 * Database Migration Runner
 * 
 * Usage: node run-migration.js <migration-file>
 * 
 * Requires DATABASE_URL environment variable:
 * DATABASE_URL=postgresql://user:pass@host:port/database
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Get migration file from command line
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Error: Migration file not specified');
  console.error('Usage: node run-migration.js <migration-file>');
  console.error('Example: node run-migration.js migrations/001_create_tables.sql');
  process.exit(1);
}

// Check if file exists
const migrationPath = path.join(__dirname, migrationFile);
if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Error: Migration file not found: ${migrationPath}`);
  process.exit(1);
}

// Check DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable not set');
  console.error('Example: DATABASE_URL=postgresql://user:pass@host:port/database');
  process.exit(1);
}

// Run migration
(async () => {
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected');

    console.log(`📄 Reading migration: ${path.basename(migrationFile)}`);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Executing migration...');
    await client.query(sql);
    console.log('✅ Migration completed successfully');

    // Show tables
    console.log('\n📊 Current database tables:');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    if (result.rows.length === 0) {
      console.log('  (no tables found)');
    } else {
      result.rows.forEach(row => console.log(`  - ${row.table_name}`));
    }

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    if (error.detail) console.error('Detail:', error.detail);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Connection closed');
  }
})();
