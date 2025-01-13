import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useClientData(searchQuery = '') {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('parcels')
          .select('*')
          .order('created_at', { ascending: false });

        if (searchQuery) {
          query = query.or(
            'recipient_name.ilike.%' + searchQuery + '%,' +
            'recipient_email.ilike.%' + searchQuery + '%,' +
            'recipient_phone.ilike.%' + searchQuery + '%'
          );
        }

        const { data, error: supabaseError } = await query;

        if (supabaseError) throw supabaseError;

        // Grouper les données par client
        const clientsMap = data.reduce((acc, parcel) => {
          const clientKey = `${parcel.recipient_name}-${parcel.recipient_email}-${parcel.recipient_phone}`;
          
          if (!acc[clientKey]) {
            acc[clientKey] = {
              name: parcel.recipient_name,
              email: parcel.recipient_email,
              phone: parcel.recipient_phone,
              country: parcel.country || 'FR',
              totalParcels: 0,
              lastShipmentDate: null,
              parcels: []
            };
          }

          acc[clientKey].totalParcels += 1;
          acc[clientKey].parcels.push(parcel);
          
          if (parcel.country && (!acc[clientKey].country || acc[clientKey].country === 'FR')) {
            acc[clientKey].country = parcel.country;
          }
          
          const shipmentDate = new Date(parcel.created_at);
          if (!acc[clientKey].lastShipmentDate || shipmentDate > new Date(acc[clientKey].lastShipmentDate)) {
            acc[clientKey].lastShipmentDate = parcel.created_at;
          }

          return acc;
        }, {});

        setClients(Object.values(clientsMap));
        setError(null);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();

    const subscription = supabase
      .channel('parcels_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'parcels' 
        }, 
        fetchClients
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [searchQuery]);

  return { clients, loading, error };
}
