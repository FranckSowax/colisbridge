import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parcelService } from '../services/parcelService';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export function useParcels(userId) {
  const queryClient = useQueryClient();

  // Récupération des colis
  const {
    data: parcels = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['parcels', userId],
    queryFn: () => parcelService.fetchParcels(userId),
    enabled: !!userId,
  });

  // Mise à jour du statut
  const updateStatus = useMutation({
    mutationFn: ({ parcelId, status }) => 
      parcelService.updateParcelStatus(parcelId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['parcels', userId]);
      toast.success('Statut mis à jour avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    },
  });

  // Suppression d'un colis
  const deleteParcel = useMutation({
    mutationFn: (parcelId) => parcelService.deleteParcel(parcelId),
    onSuccess: () => {
      queryClient.invalidateQueries(['parcels', userId]);
      toast.success('Colis supprimé avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    },
  });

  // Souscription aux changements en temps réel
  useEffect(() => {
    if (!userId) return;

    const subscription = parcelService.subscribeToChanges(userId, () => {
      queryClient.invalidateQueries(['parcels', userId]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, queryClient]);

  return {
    parcels,
    isLoading,
    error,
    updateStatus: updateStatus.mutate,
    deleteParcel: deleteParcel.mutate,
  };
}
