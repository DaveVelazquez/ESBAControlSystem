const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

// Placeholder routes
router.post('/:orderId/evidences/photo', authMiddleware, (req, res) => {
  res.status(501).json({ message: 'Photo upload endpoint - to be implemented' });
});

router.post('/:orderId/evidences/signature', authMiddleware, (req, res) => {
  res.status(501).json({ message: 'Signature endpoint - to be implemented' });
});

router.get('/:orderId/evidences', authMiddleware, (req, res) => {
  res.status(501).json({ message: 'Get evidences endpoint - to be implemented' });
});

module.exports = router;
