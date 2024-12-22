const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Route pour le webhook ManyChat
router.post('/manychat', webhookController.handleManyChatWebhook.bind(webhookController));

module.exports = router;
