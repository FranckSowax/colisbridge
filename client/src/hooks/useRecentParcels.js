import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabaseConfig';

export function useRecentParcels(page = 1, limit = 10) {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchParcels = async () => {
      try {
        setLoading(true);
        
        // Calculer l'offset basé sur la page et la limite
        const offset = (page - 1) * limit;

        // Récupérer les colis avec pagination
        const { data, error, count } = await supabase
          .from('parcels')
          .select(`
            id,
            tracking_number,
            created_at,
            recipient_name,
            country,
            weight,
            status
          `, { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        setParcels(data);
        setHasMore(count > offset + limit);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchParcels();
  }, [page, limit]);

  return { parcels, loading, error, hasMore };
}
