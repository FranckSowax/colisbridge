const axios = require('axios');
const logger = require('../utils/logger');

class ManyChatService {
  constructor() {
    this.apiKey = process.env.MANYCHAT_API_KEY;
    this.baseUrl = 'https://api.manychat.com';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async sendNotification(subscriberId, flowId, customFields = {}) {
    try {
      const response = await this.client.post('/fb/sending/sendFlow', {
        subscriber_id: subscriberId,
        flow_id: flowId,
        custom_fields: customFields
      });
      
      logger.info(`Notification envoyée via ManyChat`, {
        subscriberId,
        flowId,
        response: response.data
      });

      return response.data;
    } catch (error) {
      logger.error('Erreur lors de l\'envoi de la notification ManyChat', {
        error: error.message,
        subscriberId,
        flowId
      });
      throw error;
    }
  }

  async updateCustomFields(subscriberId, fields) {
    try {
      const response = await this.client.post('/fb/subscriber/setCustomFields', {
        subscriber_id: subscriberId,
        fields
      });

      logger.info('Champs personnalisés mis à jour dans ManyChat', {
        subscriberId,
        fields
      });

      return response.data;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des champs personnalisés', {
        error: error.message,
        subscriberId,
        fields
      });
      throw error;
    }
  }

  verifyWebhookSignature(signature, payload) {
    // Implémentez la vérification de signature selon la documentation ManyChat
    const webhookSecret = process.env.MANYCHAT_WEBHOOK_SECRET;
    // TODO: Ajouter la logique de vérification de signature
    return true;
  }
}

module.exports = new ManyChatService();
