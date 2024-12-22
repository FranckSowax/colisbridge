import { supabase } from '../config/supabaseClient';

const COUNTRIES = {
  france: 'France',
  gabon: 'Gabon',
  togo: 'Togo',
  cote_ivoire: "Côte d'Ivoire",
  dubai: 'Dubaï'
};

export const parcelService = {
  async fetchParcels(userId) {
    const { data, error } = await supabase
      .from('parcels')
      .select(`
        *,
        recipient:recipients (
          id,
          name,
          phone,
          email,
          address
        )
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Transformer les données pour inclure les informations du destinataire
    const transformedData = data.map(parcel => ({
      ...parcel,
      recipient_name: parcel.recipient?.name || 'N/A',
      destination_country: COUNTRIES[parcel.country] || parcel.country || 'N/A',
      recipient_address: parcel.recipient?.address || 'N/A'
    }));

    return transformedData;
  },

  async updateParcelStatus(parcelId, status) {
    const { data, error } = await supabase
      .from('parcels')
      .update({ status })
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
    const subscription = supabase
      .channel('parcels_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parcels',
          filter: `created_by=eq.${userId}`
        },
        onUpdate
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
};
