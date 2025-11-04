const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const db = require('../config/database');

// GET /api/technicians
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { available, zone_id } = req.query;

    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.active,
             tp.skills, tp.availability_status,
             (
               SELECT json_build_object(
                 'latitude', tl.latitude,
                 'longitude', tl.longitude,
                 'updated_at', tl.created_at
               )
               FROM technician_locations tl
               WHERE tl.technician_id = u.id
               AND tl.is_active = true
               ORDER BY tl.created_at DESC
               LIMIT 1
             ) as current_location,
             (
               SELECT COUNT(*)
               FROM orders o
               WHERE o.assigned_technician_id = u.id
               AND o.status IN ('assigned', 'in_progress', 'en_route')
             ) as active_orders
      FROM users u
      LEFT JOIN technician_profiles tp ON tp.user_id = u.id
      WHERE u.role = 'technician'
      AND u.active = true
    `;

    const params = [];
    let paramIndex = 1;

    if (available === 'true') {
      query += ` AND tp.availability_status = 'available'`;
    }

    if (zone_id) {
      query += ` AND $${paramIndex} = ANY(u.zone_ids)`;
      params.push(zone_id);
    }

    query += ' ORDER BY u.name';

    const result = await db.query(query, params);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/technicians/:id/orders
router.get('/:id/orders', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, date_from, date_to } = req.query;

    let query = `
      SELECT o.*, c.name as client_name, s.address as site_address
      FROM orders o
      LEFT JOIN clients c ON o.client_id = c.id
      LEFT JOIN sites s ON o.site_id = s.id
      WHERE o.assigned_technician_id = $1
    `;

    const params = [id];
    let paramIndex = 2;

    if (status) {
      query += ` AND o.status = $${paramIndex}`;
      params.push(status);
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

    query += ' ORDER BY o.scheduled_start DESC';

    const result = await db.query(query, params);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
