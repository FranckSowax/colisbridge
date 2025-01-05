import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parcelService } from '../services/parcelService';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../config/supabaseClient';

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
    
    const query = searchQuery.toLowerCase().trim();
    const searchFields = [
      parcel.tracking_number,
      parcel.recipient_name,
      parcel.recipient_phone,
      parcel.destination_country,
      parcel.destination_address
    ];

    return searchFields.some(field => 
      field?.toLowerCase().includes(query)
    );
  });

  // Mise à jour des statistiques
  const updateStatistics = async (parcel) => {
    try {
      // Récupérer les statistiques actuelles
      const { data: stats } = await supabase
        .from('statistics')
        .select('*')
        .single();

      // Si le statut est passé à "termine", ajouter le montant au chiffre d'affaires
      if (parcel.status === 'termine') {
        const newRevenue = (stats?.total_revenue || 0) + (parcel.total_amount || 0);
        
        // Mettre à jour les statistiques
        await supabase
          .from('statistics')
          .upsert({
            id: stats?.id || 1,
            total_revenue: newRevenue,
            last_updated: new Date().toISOString(),
            total_parcels: (stats?.total_parcels || 0) + 1,
            country_stats: {
              ...stats?.country_stats,
              [parcel.destination_country]: {
                parcels: ((stats?.country_stats?.[parcel.destination_country]?.parcels || 0) + 1),
                revenue: ((stats?.country_stats?.[parcel.destination_country]?.revenue || 0) + (parcel.total_amount || 0))
              }
            }
          });

        // Invalider le cache des statistiques pour forcer un rechargement
        queryClient.invalidateQueries(['statistics']);
      }
    } catch (error) {
      console.error('Error updating statistics:', error);
    }
  };

  // Mutation pour la mise à jour du statut
  const updateParcelStatus = useMutation({
    mutationFn: async ({ parcelId, status, updateData }) => {
      const { data, error } = await supabase
        .from('parcels')
        .update({ 
          status,
          sent_date: status === 'expedie' ? new Date().toISOString() : null,
          delivered_date: status === 'termine' ? new Date().toISOString() : null,
          ...updateData
        })
        .eq('id', parcelId)
        .select()
        .single();

      if (error) throw error;
      // Mettre à jour les statistiques si nécessaire
      if (status === 'termine') {
        await updateStatistics(data);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parcels', userId]);
      toast.success('Statut mis à jour avec succès');
    },
    onError: (error) => {
      console.error('Error updating parcel status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    },
  });

  // Mutation pour la suppression
  const deleteParcel = useMutation({
    mutationFn: async (parcelId) => {
      const { error } = await supabase
        .from('parcels')
        .delete()
        .eq('id', parcelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parcels', userId]);
      toast.success('Colis supprimé avec succès');
    },
    onError: (error) => {
      console.error('Error deleting parcel:', error);
      toast.error('Erreur lors de la suppression du colis');
    },
  });

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return {
    parcels,
    isLoading,
    error,
    updateParcelStatus: (parcelId, status, updateData) => updateParcelStatus.mutate({ parcelId, status, updateData }),
    deleteParcel: (parcelId) => deleteParcel.mutate(parcelId),
    searchQuery,
    handleSearch,
  };
}
