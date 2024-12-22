const manychatService = require('../services/manychatService');
const logger = require('../utils/logger');

class WebhookController {
  async handleManyChatWebhook(req, res) {
    try {
      const signature = req.headers['x-manychat-signature'];
      
      // Vérifier la signature du webhook
      if (!manychatService.verifyWebhookSignature(signature, req.body)) {
        logger.warn('Signature de webhook ManyChat invalide');
        return res.status(401).json({ error: 'Signature invalide' });
      }

      // Traiter les différents types d'événements
      const { type, data } = req.body;

      switch (type) {
        case 'subscriber.new':
          await this.handleNewSubscriber(data);
          break;
        case 'flow.trigger':
          await this.handleFlowTrigger(data);
          break;
        // Ajouter d'autres types d'événements selon les besoins
        default:
          logger.info(`Type d'événement ManyChat non géré: ${type}`);
      }

      res.json({ status: 'success' });
    } catch (error) {
      logger.error('Erreur lors du traitement du webhook ManyChat', {
        error: error.message
      });
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  async handleNewSubscriber(data) {
    // Logique pour gérer un nouveau subscriber
    logger.info('Nouveau subscriber ManyChat', { data });
  }

  async handleFlowTrigger(data) {
    // Logique pour gérer le déclenchement d'un flow
    logger.info('Flow ManyChat déclenché', { data });
  }
}

module.exports = new WebhookController();
