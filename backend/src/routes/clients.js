const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

// ==================== CLIENTS ====================

// GET /api/clients - List all clients
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM work_orders WHERE client_id = c.id) as total_orders,
        (SELECT json_build_object(
          'name', cc.name,
          'email', cc.email,
          'phone', cc.phone
        ) FROM client_contacts cc WHERE cc.client_id = c.id AND cc.is_primary = true LIMIT 1) as primary_contact
      FROM clients c
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND c.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (search) {
      query += ` AND (c.name ILIKE $${paramCount} OR c.email ILIKE $${paramCount} OR c.phone ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM clients WHERE 1=1';
    const countParams = [];
    if (status) countParams.push(status);
    if (search) countParams.push(`%${search}%`);

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/clients/:id - Get client by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM clients WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Client not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/clients - Create client
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, legal_name, email, phone, status = 'active' } = req.body;

    if (!name) {
      throw new AppError('Name is required', 400);
    }

    const result = await db.query(
      `INSERT INTO clients (name, legal_name, email, phone, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, legal_name, email, phone, status]
    );

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/clients/:id - Update client
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, legal_name, email, phone, status } = req.body;

    const result = await db.query(
      `UPDATE clients 
       SET name = COALESCE($1, name),
           legal_name = COALESCE($2, legal_name),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           status = COALESCE($5, status),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [name, legal_name, email, phone, status, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Client not found', 404);
    }

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/clients/:id - Deactivate client
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE clients SET status = 'inactive', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Client not found', 404);
    }

    res.json({
      success: true,
      message: 'Client deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ==================== CONTACTS ====================

// GET /api/clients/:id/contacts - Get client contacts
router.get('/:id/contacts', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM client_contacts WHERE client_id = $1 ORDER BY is_primary DESC, created_at ASC',
      [id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/clients/:id/contacts - Add contact
router.post('/:id/contacts', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, is_primary } = req.body;

    if (!name) {
      throw new AppError('Contact name is required', 400);
    }

    // If setting as primary, unset others
    if (is_primary) {
      await db.query(
        'UPDATE client_contacts SET is_primary = false WHERE client_id = $1',
        [id]
      );
    }

    const result = await db.query(
      `INSERT INTO client_contacts (client_id, name, email, phone, role, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, name, email, phone, role, is_primary || false]
    );

    res.status(201).json({
      success: true,
      message: 'Contact added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/clients/:id/contacts/:contactId - Update contact
router.put('/:id/contacts/:contactId', authenticate, async (req, res, next) => {
  try {
    const { id, contactId } = req.params;
    const { name, email, phone, role, is_primary } = req.body;

    // If setting as primary, unset others
    if (is_primary) {
      await db.query(
        'UPDATE client_contacts SET is_primary = false WHERE client_id = $1 AND id != $2',
        [id, contactId]
      );
    }

    const result = await db.query(
      `UPDATE client_contacts
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           role = COALESCE($4, role),
           is_primary = COALESCE($5, is_primary)
       WHERE id = $6 AND client_id = $7
       RETURNING *`,
      [name, email, phone, role, is_primary, contactId, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Contact not found', 404);
    }

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/clients/:id/contacts/:contactId - Delete contact
router.delete('/:id/contacts/:contactId', authenticate, async (req, res, next) => {
  try {
    const { contactId } = req.params;

    const result = await db.query(
      'DELETE FROM client_contacts WHERE id = $1 RETURNING *',
      [contactId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Contact not found', 404);
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ==================== LOCATIONS ====================

// GET /api/clients/:id/locations - Get client locations
router.get('/:id/locations', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM client_locations WHERE client_id = $1 ORDER BY is_default DESC, created_at ASC',
      [id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/clients/:id/locations - Add location
router.post('/:id/locations', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address, latitude, longitude, is_default } = req.body;

    if (!name || !address) {
      throw new AppError('Name and address are required', 400);
    }

    // If setting as default, unset others
    if (is_default) {
      await db.query(
        'UPDATE client_locations SET is_default = false WHERE client_id = $1',
        [id]
      );
    }

    const result = await db.query(
      `INSERT INTO client_locations (client_id, name, address, latitude, longitude, is_default)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, name, address, latitude, longitude, is_default || false]
    );

    res.status(201).json({
      success: true,
      message: 'Location added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/clients/:id/locations/:locationId - Update location
router.put('/:id/locations/:locationId', authenticate, async (req, res, next) => {
  try {
    const { id, locationId } = req.params;
    const { name, address, latitude, longitude, is_default } = req.body;

    // If setting as default, unset others
    if (is_default) {
      await db.query(
        'UPDATE client_locations SET is_default = false WHERE client_id = $1 AND id != $2',
        [id, locationId]
      );
    }

    const result = await db.query(
      `UPDATE client_locations
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           latitude = COALESCE($3, latitude),
           longitude = COALESCE($4, longitude),
           is_default = COALESCE($5, is_default)
       WHERE id = $6 AND client_id = $7
       RETURNING *`,
      [name, address, latitude, longitude, is_default, locationId, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Location not found', 404);
    }

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/clients/:id/locations/:locationId - Delete location
router.delete('/:id/locations/:locationId', authenticate, async (req, res, next) => {
  try {
    const { locationId } = req.params;

    const result = await db.query(
      'DELETE FROM client_locations WHERE id = $1 RETURNING *',
      [locationId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Location not found', 404);
    }

    res.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ==================== CONTRACTS ====================

// GET /api/clients/:id/contracts - Get client contracts
router.get('/:id/contracts', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM client_contracts WHERE client_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/clients/:id/contracts - Add contract
router.post('/:id/contracts', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contract_number, start_date, end_date, sla_response_time, sla_resolution_time, file_url, status } = req.body;

    const result = await db.query(
      `INSERT INTO client_contracts (client_id, contract_number, start_date, end_date, sla_response_time, sla_resolution_time, file_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, contract_number, start_date, end_date, sla_response_time, sla_resolution_time, file_url, status || 'active']
    );

    res.status(201).json({
      success: true,
      message: 'Contract added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/clients/:id/contracts/:contractId - Update contract
router.put('/:id/contracts/:contractId', authenticate, async (req, res, next) => {
  try {
    const { contractId } = req.params;
    const { contract_number, start_date, end_date, sla_response_time, sla_resolution_time, file_url, status } = req.body;

    const result = await db.query(
      `UPDATE client_contracts
       SET contract_number = COALESCE($1, contract_number),
           start_date = COALESCE($2, start_date),
           end_date = COALESCE($3, end_date),
           sla_response_time = COALESCE($4, sla_response_time),
           sla_resolution_time = COALESCE($5, sla_resolution_time),
           file_url = COALESCE($6, file_url),
           status = COALESCE($7, status),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [contract_number, start_date, end_date, sla_response_time, sla_resolution_time, file_url, status, contractId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Contract not found', 404);
    }

    res.json({
      success: true,
      message: 'Contract updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/clients/:id/contracts/:contractId - Delete contract
router.delete('/:id/contracts/:contractId', authenticate, async (req, res, next) => {
  try {
    const { contractId } = req.params;

    const result = await db.query(
      'DELETE FROM client_contracts WHERE id = $1 RETURNING *',
      [contractId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Contract not found', 404);
    }

    res.json({
      success: true,
      message: 'Contract deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ==================== SERVICE HISTORY ====================

// GET /api/clients/:id/service-history - Get work orders for client
router.get('/:id/service-history', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT wo.*, 
        u.name as technician_name,
        cl.name as location_name,
        EXTRACT(EPOCH FROM (wo.completed_at - wo.created_at))/60 as duration_minutes
       FROM work_orders wo
       LEFT JOIN users u ON wo.assigned_to = u.id
       LEFT JOIN client_locations cl ON wo.location_id = cl.id
       WHERE wo.client_id = $1
       ORDER BY wo.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) FROM work_orders WHERE client_id = $1',
      [id]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
