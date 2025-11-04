const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const db = require('../config/database');

// POST /api/locations/ping
router.post('/ping', authMiddleware, async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy, order_id } = req.body;

    const result = await db.query(`
      INSERT INTO technician_locations (
        technician_id, order_id, latitude, longitude, 
        accuracy_meters, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, true, NOW())
      RETURNING *
    `, [req.user.id, order_id || null, latitude, longitude, accuracy || null]);

    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    io.emit('location-update', {
      technicianId: req.user.id,
      latitude,
      longitude,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/locations/technicians
router.get('/technicians', authMiddleware, async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT ON (tl.technician_id)
             tl.*, 
             u.name as technician_name,
             o.order_number
      FROM technician_locations tl
      JOIN users u ON u.id = tl.technician_id
      LEFT JOIN orders o ON o.id = tl.order_id
      WHERE tl.is_active = true
      AND tl.created_at > NOW() - INTERVAL '10 minutes'
      ORDER BY tl.technician_id, tl.created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
