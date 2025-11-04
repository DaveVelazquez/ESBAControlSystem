const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

// GET /api/orders
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { status, technician_id, date_from, date_to, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT o.*, 
             c.name as client_name,
             s.address as site_address, s.latitude as site_lat, s.longitude as site_lng,
             u.name as technician_name,
             st.name as service_type_name
      FROM orders o
      LEFT JOIN clients c ON o.client_id = c.id
      LEFT JOIN sites s ON o.site_id = s.id
      LEFT JOIN users u ON o.assigned_technician_id = u.id
      LEFT JOIN service_types st ON o.service_type_id = st.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (technician_id) {
      query += ` AND o.assigned_technician_id = $${paramIndex}`;
      params.push(technician_id);
      paramIndex++;
    }

    if (date_from) {
      query += ` AND o.scheduled_start >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      query += ` AND o.scheduled_end <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }

    query += ` ORDER BY o.scheduled_start DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rowCount
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT o.*, 
             c.name as client_name, c.phone as client_phone, c.email as client_email,
             s.address as site_address, s.latitude as site_lat, s.longitude as site_lng,
             u.name as technician_name, u.email as technician_email, u.phone as technician_phone,
             st.name as service_type_name, st.sla_hours
      FROM orders o
      LEFT JOIN clients c ON o.client_id = c.id
      LEFT JOIN sites s ON o.site_id = s.id
      LEFT JOIN users u ON o.assigned_technician_id = u.id
      LEFT JOIN service_types st ON o.service_type_id = st.id
      WHERE o.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      throw new AppError('Order not found', 404);
    }

    // Get events
    const events = await db.query(`
      SELECT * FROM order_events 
      WHERE order_id = $1 
      ORDER BY created_at DESC
    `, [id]);

    // Get evidences
    const evidences = await db.query(`
      SELECT * FROM evidences 
      WHERE order_id = $1 
      ORDER BY created_at DESC
    `, [id]);

    res.status(200).json({
      success: true,
      data: {
        ...result.rows[0],
        events: events.rows,
        evidences: evidences.rows
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders
router.post('/', [
  authMiddleware,
  roleMiddleware(['dispatcher', 'admin']),
  body('client_id').isUUID(),
  body('site_id').isUUID(),
  body('service_type_id').isUUID(),
  body('scheduled_start').isISO8601(),
  body('scheduled_end').isISO8601()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { client_id, site_id, service_type_id, scheduled_start, scheduled_end, notes, priority } = req.body;

    // Get SLA hours
    const serviceType = await db.query(
      'SELECT sla_hours FROM service_types WHERE id = $1',
      [service_type_id]
    );

    if (serviceType.rows.length === 0) {
      throw new AppError('Service type not found', 404);
    }

    // Calculate SLA deadline
    const slaDeadline = new Date(scheduled_start);
    slaDeadline.setHours(slaDeadline.getHours() + serviceType.rows[0].sla_hours);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

    const result = await db.query(`
      INSERT INTO orders (
        order_number, client_id, site_id, service_type_id, 
        scheduled_start, scheduled_end, sla_deadline,
        status, priority, notes, created_by_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `, [
      orderNumber, client_id, site_id, service_type_id,
      scheduled_start, scheduled_end, slaDeadline,
      'pending', priority || 'normal', notes, req.user.id
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Additional routes for assign, reassign, etc. would go here

module.exports = router;
