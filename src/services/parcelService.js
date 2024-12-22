const { supabaseAdmin } = require('../config/supabase');
const logger = require('../utils/logger');

class ParcelService {
  async createParcel(parcelData, userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('parcels')
        .insert([{
          user_id: userId,
          tracking_number: this.generateTrackingNumber(),
          status: 'received',
          origin_country: parcelData.originCountry,
          destination_country: parcelData.destinationCountry,
          weight: parcelData.weight,
          length: parcelData.length,
          width: parcelData.width,
          height: parcelData.height,
          declared_value: parcelData.declaredValue,
          description: parcelData.description,
          photos: parcelData.photos,
          customs_declaration: parcelData.customsDeclaration,
          estimated_delivery_date: parcelData.estimatedDeliveryDate
        }])
        .select()
        .single();

      if (error) throw error;

      // Créer la première entrée dans l'historique
      await this.addStatusHistory(data.id, 'received', userId, 'Colis reçu en entrepôt');

      return data;
    } catch (error) {
      logger.error('Erreur lors de la création du colis:', error);
      throw error;
    }
  }

  async updateParcelStatus(parcelId, newStatus, userId, notes) {
    try {
      const { data, error } = await supabaseAdmin
        .from('parcels')
        .update({
          status: newStatus,
          last_status_update: new Date().toISOString()
        })
        .eq('id', parcelId)
        .select()
        .single();

      if (error) throw error;

      // Ajouter l'entrée dans l'historique
      await this.addStatusHistory(parcelId, newStatus, userId, notes);

      return data;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  }

  async addStatusHistory(parcelId, status, userId, notes) {
    try {
      const { data, error } = await supabaseAdmin
        .from('parcel_status_history')
        .insert([{
          parcel_id: parcelId,
          status,
          changed_by: userId,
          notes,
          notification_sent: false
        }])
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Erreur lors de l\'ajout à l\'historique:', error);
      throw error;
    }
  }

  async getParcelDetails(parcelId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('parcels')
        .select(\`
          *,
          user:profiles(*),
          status_history:parcel_status_history(*)
        \`)
        .eq('id', parcelId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Erreur lors de la récupération des détails du colis:', error);
      throw error;
    }
  }

  generateTrackingNumber() {
    const prefix = 'CB';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return \`\${prefix}\${timestamp}\${random}\`;
  }
}

module.exports = new ParcelService();
