import { supabase } from '../config/supabaseClient';

export const notificationService = {
  async createNotification({
    userId,
    title,
    message,
    type,
    referenceId = null,
    referenceType = null,
  }) {
    try {
      const { data, error } = await supabase.from('notifications').insert([
        {
          user_id: userId,
          title,
          message,
          type,
          reference_id: referenceId,
          reference_type: referenceType,
        },
      ]);

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
      referenceId: parcelId,
      referenceType: 'parcel',
    });
  },

  async notifyStatusUpdated(userId, parcelId, trackingNumber, newStatus) {
    return this.createNotification({
      userId,
      title: 'Statut mis à jour',
      message: `Le statut du colis ${trackingNumber} a été mis à jour vers "${newStatus}".`,
      type: 'status_updated',
      referenceId: parcelId,
      referenceType: 'parcel',
    });
  },

  async notifyDisputeCreated(userId, disputeId, trackingNumber) {
    return this.createNotification({
      userId,
      title: 'Nouveau litige créé',
      message: `Un nouveau litige a été créé pour le colis ${trackingNumber}.`,
      type: 'dispute_created',
      referenceId: disputeId,
      referenceType: 'dispute',
    });
  },

  async notifyDisputeResolved(userId, disputeId, trackingNumber) {
    return this.createNotification({
      userId,
      title: 'Litige résolu',
      message: `Le litige pour le colis ${trackingNumber} a été résolu.`,
      type: 'dispute_resolved',
      referenceId: disputeId,
      referenceType: 'dispute',
    });
  },
};
