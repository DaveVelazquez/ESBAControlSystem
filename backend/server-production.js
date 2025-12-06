const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Database pool
let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('supabase.co') ? {
      rejectUnauthorized: false
    } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });
  
  pool.on('error', (err) => {
    console.error('Database pool error:', err);
  });
  
  console.log('✅ Database pool configured');
} else {
  console.warn('⚠️  DATABASE_URL not configured');
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'],
  credentials: false
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: pool ? 'configured' : 'not configured'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Field Service Manager API',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/login',
      clients: '/api/clients'
    },
    timestamp: new Date().toISOString()
  });
});

// ==================== AUTH ====================

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@fieldservice.com' && password === 'admin123') {
    return res.json({
      success: true,
      token: 'simple-jwt-' + Date.now(),
      user: {
        id: 1,
        email: 'admin@fieldservice.com',
        name: 'System Administrator',
        role: 'admin'
      }
    });
  }
  
  res.status(401).json({
    success: false,
    message: 'Invalid credentials'
  });
});

// ==================== CLIENTS API ====================

// Helper function for database queries
const dbQuery = async (text, params) => {
  if (!pool) {
    throw new Error('Database not configured');
  }
  return pool.query(text, params);
};

// GET /api/clients - List clients
app.get('/api/clients', async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let query = 'SELECT * FROM clients WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (search) {
      query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await dbQuery(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('GET /api/clients error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/clients/:id - Get client details
app.get('/api/clients/:id', async (req, res) => {
  try {
    const result = await dbQuery('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('GET /api/clients/:id error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/clients - Create client
app.post('/api/clients', async (req, res) => {
  try {
    const { name, email, phone, address, status } = req.body;
    
    const result = await dbQuery(
      `INSERT INTO clients (name, email, phone, address, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, email, phone, address, status || 'active']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('POST /api/clients error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/clients/:id - Update client
app.put('/api/clients/:id', async (req, res) => {
  try {
    const { name, email, phone, address, status } = req.body;
    
    const result = await dbQuery(
      `UPDATE clients 
       SET name = $1, email = $2, phone = $3, address = $4, status = $5, updated_at = NOW()
       WHERE id = $6 
       RETURNING *`,
      [name, email, phone, address, status, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('PUT /api/clients/:id error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/clients/:id - Delete client
app.delete('/api/clients/:id', async (req, res) => {
  try {
    const result = await dbQuery('DELETE FROM clients WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json({ success: true, message: 'Client deleted' });
  } catch (error) {
    console.error('DELETE /api/clients/:id error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== CONTACTS ====================

app.get('/api/clients/:clientId/contacts', async (req, res) => {
  try {
    const result = await dbQuery(
      'SELECT * FROM client_contacts WHERE client_id = $1 ORDER BY is_primary DESC, name',
      [req.params.clientId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('GET contacts error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clients/:clientId/contacts', async (req, res) => {
  try {
    const { name, title, email, phone, is_primary } = req.body;
    
    const result = await dbQuery(
      `INSERT INTO client_contacts (client_id, name, title, email, phone, is_primary) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [req.params.clientId, name, title, email, phone, is_primary || false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('POST contact error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/clients/:clientId/contacts/:contactId', async (req, res) => {
  try {
    const { name, title, email, phone, is_primary } = req.body;
    
    const result = await dbQuery(
      `UPDATE client_contacts 
       SET name = $1, title = $2, email = $3, phone = $4, is_primary = $5, updated_at = NOW()
       WHERE id = $6 AND client_id = $7
       RETURNING *`,
      [name, title, email, phone, is_primary, req.params.contactId, req.params.clientId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('PUT contact error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/clients/:clientId/contacts/:contactId', async (req, res) => {
  try {
    const result = await dbQuery(
      'DELETE FROM client_contacts WHERE id = $1 AND client_id = $2 RETURNING id',
      [req.params.contactId, req.params.clientId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE contact error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== LOCATIONS ====================

app.get('/api/clients/:clientId/locations', async (req, res) => {
  try {
    const result = await dbQuery(
      'SELECT * FROM client_locations WHERE client_id = $1 ORDER BY is_default DESC, address',
      [req.params.clientId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('GET locations error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clients/:clientId/locations', async (req, res) => {
  try {
    const { address, city, state, postal_code, country, latitude, longitude, is_default } = req.body;
    
    const result = await dbQuery(
      `INSERT INTO client_locations 
       (client_id, address, city, state, postal_code, country, latitude, longitude, is_default) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [req.params.clientId, address, city, state, postal_code, country || 'USA', latitude, longitude, is_default || false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('POST location error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/clients/:clientId/locations/:locationId', async (req, res) => {
  try {
    const { address, city, state, postal_code, country, latitude, longitude, is_default } = req.body;
    
    const result = await dbQuery(
      `UPDATE client_locations 
       SET address = $1, city = $2, state = $3, postal_code = $4, country = $5,
           latitude = $6, longitude = $7, is_default = $8, updated_at = NOW()
       WHERE id = $9 AND client_id = $10
       RETURNING *`,
      [address, city, state, postal_code, country, latitude, longitude, is_default, req.params.locationId, req.params.clientId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('PUT location error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/clients/:clientId/locations/:locationId', async (req, res) => {
  try {
    const result = await dbQuery(
      'DELETE FROM client_locations WHERE id = $1 AND client_id = $2 RETURNING id',
      [req.params.locationId, req.params.clientId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE location error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== CONTRACTS ====================

app.get('/api/clients/:clientId/contracts', async (req, res) => {
  try {
    const result = await dbQuery(
      'SELECT * FROM client_contracts WHERE client_id = $1 ORDER BY start_date DESC',
      [req.params.clientId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('GET contracts error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clients/:clientId/contracts', async (req, res) => {
  try {
    const { contract_type, start_date, end_date, sla_response_time, sla_resolution_time, status } = req.body;
    
    const result = await dbQuery(
      `INSERT INTO client_contracts 
       (client_id, contract_type, start_date, end_date, sla_response_time, sla_resolution_time, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [req.params.clientId, contract_type, start_date, end_date, sla_response_time, sla_resolution_time, status || 'active']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('POST contract error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/clients/:clientId/contracts/:contractId', async (req, res) => {
  try {
    const { contract_type, start_date, end_date, sla_response_time, sla_resolution_time, status } = req.body;
    
    const result = await dbQuery(
      `UPDATE client_contracts 
       SET contract_type = $1, start_date = $2, end_date = $3, 
           sla_response_time = $4, sla_resolution_time = $5, status = $6, updated_at = NOW()
       WHERE id = $7 AND client_id = $8
       RETURNING *`,
      [contract_type, start_date, end_date, sla_response_time, sla_resolution_time, status, req.params.contractId, req.params.clientId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('PUT contract error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/clients/:clientId/contracts/:contractId', async (req, res) => {
  try {
    const result = await dbQuery(
      'DELETE FROM client_contracts WHERE id = $1 AND client_id = $2 RETURNING id',
      [req.params.contractId, req.params.clientId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE contract error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ERROR HANDLERS ====================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// ==================== START SERVER ====================

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 ===== FIELD SERVICE API STARTED =====');
  console.log(`⚡ Server: http://0.0.0.0:${PORT}`);
  console.log(`💚 Health: http://0.0.0.0:${PORT}/health`);
  console.log(`🔐 Login: POST /api/auth/login`);
  console.log(`👥 Clients: /api/clients`);
  console.log(`💾 Database: ${pool ? 'Connected' : 'Not configured'}`);
  console.log('========================================\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (pool) pool.end();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  if (pool) pool.end();
  process.exit(0);
});
