import { supabase } from '../config/supabaseClient';

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
          email
        )
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Transformer les données pour inclure recipient_name
    const transformedData = data.map(parcel => ({
      ...parcel,
      recipient_name: parcel.recipient_name || parcel.recipient?.name || 'N/A'
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
        onUpdate
      )
      .subscribe();
  }
};
