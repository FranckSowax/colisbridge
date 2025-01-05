import { supabase } from '../config/supabaseClient';

const COUNTRIES = {
  france: { name: 'France', flag: '🇫🇷', currency: 'EUR' },
  gabon: { name: 'Gabon', flag: '🇬🇦', currency: 'XAF' },
  togo: { name: 'Togo', flag: '🇹🇬', currency: 'XOF' },
  cote_ivoire: { name: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF' },
  dubai: { name: 'Dubaï', flag: '🇦🇪', currency: 'AED' }
};

const formatCurrency = (amount, currency) => {
  const formatters = {
    EUR: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }),
    XAF: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }),
    XOF: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }),
    AED: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' })
  };

  return formatters[currency]?.format(amount) || `${amount} ${currency}`;
};

const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  // Supprime tous les caractères non numériques
  const cleaned = phone.replace(/\D/g, '');
  // Format: XX XX XX XX XX
  return cleaned.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
};

export const parcelService = {
  async fetchParcels(userId) {
    // Vérifier que l'userId est défini et valide
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID is required and must be a valid UUID');
    }

    const { data, error } = await supabase
      .from('parcels')
      .select(`
        *,
        parcel_photos (
          id,
          url,
          file_path
        )
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching parcels:', error);
      throw new Error(error.message);
    }

    if (!data) {
      return [];
    }

    // Transformer les données pour l'affichage
    return data.map(parcel => {
      const countryInfo = COUNTRIES[parcel.destination_country?.toLowerCase()] || { 
        name: parcel.destination_country || 'N/A', 
        currency: 'XAF' 
      };
      
      return {
        ...parcel,
        recipient_phone: formatPhoneNumber(parcel.recipient_phone),
        currency: countryInfo.currency,
        formatted_price: formatCurrency(parcel.total_price || 0, countryInfo.currency)
      };
    });
  },

  async updateParcelStatus(parcelId, status) {
    const { data, error } = await supabase
      .from('parcels')
      .update({ 
        status,
        sent_date: status === 'expedie' ? new Date().toISOString() : null,
        delivered_date: status === 'termine' ? new Date().toISOString() : null
      })
      .eq('id', parcelId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async deleteParcel(parcelId) {
    const { error } = await supabase
      .from('parcels')
      .delete()
      .eq('id', parcelId);

    if (error) {
      throw new Error(error.message);
    }
  },

  subscribeToChanges(userId, onUpdate) {
    return supabase
      .channel('parcels_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parcels',
          filter: `created_by=eq.${userId}`
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .subscribe();
  }
};
