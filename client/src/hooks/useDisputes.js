import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabaseClient';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { notificationService } from '../services/notificationService';

export const DISPUTE_PRIORITIES = {
  low: { label: 'Basse', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'Haute', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
};

export const DISPUTE_STATUSES = {
  open: { label: 'Ouvert', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'En cours', color: 'bg-yellow-100 text-yellow-800' },
  resolved: { label: 'Résolu', color: 'bg-green-100 text-green-800' },
  closed: { label: 'Fermé', color: 'bg-gray-100 text-gray-800' },
};

export function useDisputes(userId) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    priority: '',
    status: '',
    dateRange: null,
  });

  // Récupération des litiges avec filtres
  const {
    data: allDisputes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['disputes', userId, filters],
    queryFn: async () => {
      let query = supabase
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

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.dateRange?.from && filters.dateRange?.to) {
        query = query
          .gte('created_at', filters.dateRange.from)
          .lte('created_at', filters.dateRange.to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Filtrage des litiges par recherche
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

  // Création d'un nouveau litige
  const createDispute = useMutation({
    mutationFn: async (disputeData) => {
      const { data, error } = await supabase
        .from('disputes')
        .insert([{ ...disputeData, created_by: userId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries(['disputes', userId]);
      toast.success('Litige créé avec succès');
      // Créer une notification
      await notificationService.notifyDisputeCreated(
        userId,
        data.id,
        data.parcels?.tracking_number
      );
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création: ${error.message}`);
    },
  });

  // Mise à jour d'un litige
  const updateDispute = useMutation({
    mutationFn: async ({ id, ...updateData }) => {
      const { data, error } = await supabase
        .from('disputes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries(['disputes', userId]);
      toast.success('Litige mis à jour avec succès');
      if (data.status === 'resolved') {
        await notificationService.notifyDisputeResolved(
          userId,
          data.id,
          data.parcels?.tracking_number
        );
      }
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    },
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

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    disputes,
    isLoading,
    error,
    createDispute,
    updateDispute,
    deleteDispute,
    searchQuery,
    handleSearch,
    filters,
    handleFilterChange,
    DISPUTE_PRIORITIES,
    DISPUTE_STATUSES,
  };
}
