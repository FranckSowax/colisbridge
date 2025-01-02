import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabaseClient';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export function useDisputes(userId) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Récupération des litiges
  const {
    data: allDisputes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['disputes', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          parcels (
            tracking_number,
            recipient_name,
            status
          )
        `)
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Filtrage des litiges
  const disputes = allDisputes.filter(dispute => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (dispute.title || '').toLowerCase().includes(query) ||
      (dispute.description || '').toLowerCase().includes(query) ||
      (dispute.parcels?.tracking_number || '').toLowerCase().includes(query) ||
      (dispute.parcels?.recipient_name || '').toLowerCase().includes(query)
    );
  });

  // Suppression d'un litige
  const deleteDispute = useMutation({
    mutationFn: async (disputeId) => {
      const { error } = await supabase
        .from('disputes')
        .delete()
        .eq('id', disputeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['disputes', userId]);
      toast.success('Litige supprimé avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    },
  });

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  return {
    disputes,
    isLoading,
    error,
    deleteDispute,
    searchQuery,
    handleSearch
  };
}
