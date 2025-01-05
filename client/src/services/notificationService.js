import { supabase } from '../config/supabaseClient';

export const notificationService = {
  async createNotification({
    userId,
    title,
    message,
    type,
    parcelId = null
  }) {
    try {
      const { data, error } = await supabase.rpc('create_notification', {
        p_type: type,
        p_title: title,
        p_message: message,
        p_user_id: userId,
        p_parcel_id: parcelId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Fonction utilitaire pour créer des notifications pour différents événements
  async notifyParcelCreated(userId, parcelId, trackingNumber) {
    return this.createNotification({
      userId,
      title: 'Nouveau colis créé',
      message: `Un nouveau colis avec le numéro de suivi ${trackingNumber} a été créé.`,
      type: 'parcel_created',
      parcelId
    });
  },

  async notifyStatusUpdated(userId, parcelId, trackingNumber, newStatus) {
    return this.createNotification({
      userId,
      title: 'Statut mis à jour',
      message: `Le statut du colis ${trackingNumber} a été mis à jour vers "${newStatus}".`,
      type: 'parcel_updated',
      parcelId
    });
  },

  async notifyDisputeCreated(userId, parcelId, trackingNumber) {
    return this.createNotification({
      userId,
      title: 'Litige ouvert',
      message: `Un litige a été ouvert pour le colis ${trackingNumber}.`,
      type: 'dispute_opened',
      parcelId
    });
  },

  async notifyDisputeResolved(userId, parcelId, trackingNumber) {
    return this.createNotification({
      userId,
      title: 'Litige résolu',
      message: `Le litige pour le colis ${trackingNumber} a été résolu.`,
      type: 'dispute_resolved',
      parcelId
    });
  }
};
