import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabaseClient';
import { useAuth } from '../context/AuthContext';

export function useRecipients() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recipients'],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('recipients')
        .select('id, name, email, phone, address')
        .eq('created_by', user.id)
        .order('name');

      if (error) {
        console.error('Erreur récupération destinataires:', error);
        throw new Error(`Erreur lors de la récupération des destinataires: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!user
  });
}
