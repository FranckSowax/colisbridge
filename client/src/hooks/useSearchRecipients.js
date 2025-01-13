import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabaseClient';

export const useSearchRecipients = (searchQuery = '') => {
  return useQuery({
    queryKey: ['recipients-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) {
        return [];
      }

      const { data, error } = await supabase
        .from('parcels')
        .select('recipient_name, recipient_phone, recipient_email, recipient_address')
        .or(`recipient_name.ilike.%${searchQuery}%,recipient_phone.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Dédupliquer les résultats par nom et téléphone
      const uniqueRecipients = data.reduce((acc, current) => {
        const key = `${current.recipient_name}-${current.recipient_phone}`;
        if (!acc[key]) {
          acc[key] = current;
        }
        return acc;
      }, {});

      return Object.values(uniqueRecipients);
    },
    enabled: searchQuery.length >= 2,
    staleTime: 30000, // 30 secondes
    cacheTime: 300000, // 5 minutes
  });
};
