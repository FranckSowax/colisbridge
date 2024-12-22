const express = require('express');
const router = express.Router();
const parcelController = require('../controllers/parcelController');
const { authenticateUser, requireRole } = require('../middlewares/auth');

// Middleware d'authentification pour toutes les routes
router.use(authenticateUser);

// Routes pour tous les utilisateurs authentifiés
router.get('/list', parcelController.listParcels);
router.get('/:parcelId', parcelController.getParcelDetails);

// Routes pour admin et agents
router.post('/', 
  requireRole(['admin', 'agent']), 
  parcelController.createParcel
);

router.put('/:parcelId/status', 
  requireRole(['admin', 'agent']), 
  parcelController.updateParcelStatus
);

module.exports = router;
