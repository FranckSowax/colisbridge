import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parcelService } from '../services/parcelService';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

export function useParcels(userId) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Récupération des colis
  const {
    data: allParcels = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['parcels', userId],
    queryFn: () => parcelService.fetchParcels(userId),
    enabled: !!userId,
  });

  // Filtrage des colis
  const parcels = allParcels.filter(parcel => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      parcel.tracking_number?.toLowerCase().includes(query) ||
      parcel.recipient_name?.toLowerCase().includes(query) ||
      parcel.recipient_phone?.includes(query) ||
      parcel.recipient_address?.toLowerCase().includes(query)
    );
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
      subscription?.unsubscribe();
    };
  }, [userId, queryClient]);

  return {
    parcels,
    isLoading,
    error,
    updateStatus: updateStatus.mutate,
    deleteParcel: deleteParcel.mutate,
    searchQuery,
    setSearchQuery
  };
}
