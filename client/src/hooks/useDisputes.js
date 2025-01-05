import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabaseClient';
import { useNotifications } from './useNotifications';

export const DISPUTE_PRIORITIES = {
  low: {
    label: 'Basse',
    color: 'bg-gray-100 text-gray-800',
  },
  medium: {
    label: 'Moyenne',
    color: 'bg-yellow-100 text-yellow-800',
  },
  high: {
    label: 'Haute',
    color: 'bg-red-100 text-red-800',
  },
  urgent: {
    label: 'Urgente',
    color: 'bg-red-500 text-white',
  },
};

export const DISPUTE_STATUSES = {
  'Reçus': {
    label: 'Reçus',
    color: 'bg-blue-100 text-blue-800',
  },
  'Expédié': {
    label: 'Expédié',
    color: 'bg-yellow-100 text-yellow-800',
  },
  'Receptionné': {
    label: 'Receptionné',
    color: 'bg-green-100 text-green-800',
  },
  'Terminé': {
    label: 'Terminé',
    color: 'bg-gray-100 text-gray-800',
  },
  'Litige': {
    label: 'Litige',
    color: 'bg-red-100 text-red-800',
  },
};

export function useDisputes(userId) {
  const queryClient = useQueryClient();
  const { createNotification } = useNotifications();

  // Récupérer tous les litiges
  const {
    data: disputes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['disputes', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Créer un nouveau litige
  const createDispute = useMutation({
    mutationFn: async (newDispute) => {
      const { data, error } = await supabase
        .from('disputes')
        .insert([{ ...newDispute, created_by: userId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['disputes']);
      createNotification({
        title: 'Nouveau litige créé',
        message: `Le litige "${data.title}" a été créé avec succès.`,
        type: 'dispute_created',
        reference_id: data.id,
        reference_type: 'dispute',
      });
    },
  });

  // Mettre à jour un litige
  const updateDispute = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('disputes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['disputes']);
      createNotification({
        title: 'Litige mis à jour',
        message: `Le litige "${data.title}" a été mis à jour.`,
        type: 'dispute_updated',
        reference_id: data.id,
        reference_type: 'dispute',
      });
    },
  });

  return {
    disputes,
    isLoading,
    error,
    createDispute,
    updateDispute,
  };
}
