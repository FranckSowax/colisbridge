import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabaseClient';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export function useClients(userId) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Récupération des clients (recipients)
  const {
    data: allClients = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['recipients', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipients')
        .select(`
          *,
          parcels:parcels(count)
        `)
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // Filtrage des clients
  const clients = allClients.filter(client => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (client.name || '').toLowerCase().includes(query) ||
      (client.phone || '').includes(query) ||
      (client.email || '').toLowerCase().includes(query) ||
      (client.address || '').toLowerCase().includes(query)
    );
  });

  // Suppression d'un client
  const deleteClient = useMutation({
    mutationFn: async (clientId) => {
      const { error } = await supabase
        .from('recipients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['recipients', userId]);
      toast.success('Client supprimé avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    },
  });

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  return {
    clients,
    isLoading,
    error,
    deleteClient: deleteClient.mutate,
    searchQuery,
    handleSearch
  };
}
