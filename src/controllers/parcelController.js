const { supabaseAdmin } = require('../config/supabase');
const logger = require('../utils/logger');
const manychatService = require('../services/manychatService');

class ParcelController {
  async createParcel(req, res) {
    try {
      const {
        userId,
        originCountry,
        destinationCountry,
        weight,
        length,
        width,
        height,
        declaredValue,
        description,
        photos = []
      } = req.body;

      const trackingNumber = this.generateTrackingNumber();

      const { data: parcel, error } = await supabaseAdmin
        .from('parcels')
        .insert([{
          user_id: userId,
          tracking_number: trackingNumber,
          origin_country: originCountry,
          destination_country: destinationCountry,
          weight,
          length,
          width,
          height,
          declared_value: declaredValue,
          description,
          photos,
          status: 'received'
        }])
        .select()
        .single();

      if (error) throw error;

      // Ajouter l'entrée dans l'historique
      await this.addStatusHistory(parcel.id, 'received', req.user.id, 'Colis reçu en entrepôt');

      // Notifier le client via ManyChat si possible
      try {
        const { data: userProfile } = await supabaseAdmin
          .from('profiles')
          .select('manychat_subscriber_id')
          .eq('id', userId)
          .single();

        if (userProfile?.manychat_subscriber_id) {
          await manychatService.sendNotification(
            userProfile.manychat_subscriber_id,
            process.env.MANYCHAT_FLOW_ID,
            {
              tracking_number: trackingNumber,
              status: 'received'
            }
          );
        }
      } catch (notifError) {
        logger.error('Erreur lors de l\'envoi de la notification:', notifError);
      }

      res.status(201).json({
        message: 'Colis créé avec succès',
        parcel
      });
    } catch (error) {
      logger.error('Erreur lors de la création du colis:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async updateParcelStatus(req, res) {
    try {
      const { parcelId } = req.params;
      const { status, notes } = req.body;

      const { data: parcel, error } = await supabaseAdmin
        .from('parcels')
        .update({
          status,
          last_status_update: new Date().toISOString()
        })
        .eq('id', parcelId)
        .select()
        .single();

      if (error) throw error;

      // Ajouter l'entrée dans l'historique
      await this.addStatusHistory(parcelId, status, req.user.id, notes);

      // Notifier le client
      try {
        const { data: userProfile } = await supabaseAdmin
          .from('profiles')
          .select('manychat_subscriber_id')
          .eq('id', parcel.user_id)
          .single();

        if (userProfile?.manychat_subscriber_id) {
          await manychatService.sendNotification(
            userProfile.manychat_subscriber_id,
            process.env.MANYCHAT_FLOW_ID,
            {
              tracking_number: parcel.tracking_number,
              status
            }
          );
        }
      } catch (notifError) {
        logger.error('Erreur lors de l\'envoi de la notification:', notifError);
      }

      res.json({
        message: 'Statut du colis mis à jour avec succès',
        parcel
      });
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du statut:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getParcelDetails(req, res) {
    try {
      const { parcelId } = req.params;

      const { data: parcel, error } = await supabaseAdmin
        .from('parcels')
        .select(\`
          *,
          user:profiles(*),
          status_history:parcel_status_history(*)
        \`)
        .eq('id', parcelId)
        .single();

      if (error) throw error;

      res.json({ parcel });
    } catch (error) {
      logger.error('Erreur lors de la récupération des détails du colis:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async listParcels(req, res) {
    try {
      const {
        status,
        destinationCountry,
        page = 1,
        limit = 10
      } = req.query;

      let query = supabaseAdmin
        .from('parcels')
        .select('*, user:profiles(*)', { count: 'exact' });

      // Appliquer les filtres
      if (status) {
        query = query.eq('status', status);
      }
      if (destinationCountry) {
        query = query.eq('destination_country', destinationCountry);
      }

      // Si l'utilisateur n'est pas admin/agent, filtrer par user_id
      if (req.user.profile.role === 'client') {
        query = query.eq('user_id', req.user.id);
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data: parcels, error, count } = await query;

      if (error) throw error;

      res.json({
        parcels,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des colis:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async addStatusHistory(parcelId, status, userId, notes) {
    try {
      const { error } = await supabaseAdmin
        .from('parcel_status_history')
        .insert([{
          parcel_id: parcelId,
          status,
          changed_by: userId,
          notes
        }]);

      if (error) throw error;
    } catch (error) {
      logger.error('Erreur lors de l\'ajout à l\'historique:', error);
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

module.exports = new ParcelController();
