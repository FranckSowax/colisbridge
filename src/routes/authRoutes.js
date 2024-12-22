const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateUser, requireRole } = require('../middlewares/auth');

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);

// Routes protégées
router.get('/profile', authenticateUser, authController.getProfile);
router.put('/profile', authenticateUser, authController.updateProfile);

// Routes admin
router.post('/register-staff', 
  authenticateUser, 
  requireRole(['admin']), 
  authController.register
);

module.exports = router;
