import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabaseClient';
import { useNotifications } from './useNotifications';
import { useAuth } from '../context/AuthContext';

export function useParcelStatus() {
  const queryClient = useQueryClient();
  const { createNotification } = useNotifications();
  const { user } = useAuth();

  const updateParcelStatus = useMutation({
    mutationFn: async ({ parcelId, newStatus, parcelData }) => {
      try {
        if (!user?.id) {
          throw new Error('Utilisateur non authentifié');
        }

        // Si le statut est "Expédié", ajouter la date d'envoi
        const updates = {
          status: newStatus,
          ...(newStatus === 'Expédié' ? { sent_date: new Date().toISOString() } : {}),
          updated_at: new Date().toISOString()
        };

        // Mettre à jour le statut du colis
        const { data: updatedParcel, error: parcelError } = await supabase
          .from('parcels')
          .update(updates)
          .eq('id', parcelId)
          .select()
          .single();

        if (parcelError) {
          console.error('Erreur lors de la mise à jour du colis:', parcelError);
          throw parcelError;
        }

        if (newStatus === 'Litige') {
          // Créer un nouveau litige
          const { error: disputeError } = await supabase
            .from('disputes')
            .insert({
              title: `Litige - Colis ${parcelData.tracking_number}`,
              description: `Un litige a été créé pour le colis ${parcelData.tracking_number} envoyé à ${parcelData.recipient_name}`,
              status: 'Reçus',
              priority: 'high',
              parcel_id: parcelId,
              created_by: user.id
            });

          if (disputeError) {
            console.error('Erreur lors de la création du litige:', disputeError);
            throw disputeError;
          }
        }

        if (newStatus === 'Terminé') {
          const today = new Date().toISOString().split('T')[0];
          // Mettre à jour les statistiques
          const { error: statsError } = await supabase
            .from('statistics')
            .upsert({
              user_id: user.id,
              entry_date: today,
              total_revenue: parcelData.total_price || 0,
              completed_revenue: parcelData.total_price || 0,
              total_parcels: 1,
              month_revenue: {
                [today.substring(0, 7)]: parcelData.total_price || 0
              }
            }, {
              onConflict: 'user_id,entry_date'
            });

          if (statsError) {
            console.error('Erreur lors de la mise à jour des statistiques:', statsError);
            throw statsError;
          }
        }

        // Créer une notification
        try {
          await createNotification({
            title: `Statut du colis mis à jour`,
            message: `Le colis ${parcelData.tracking_number} est maintenant ${newStatus}`,
            type: 'status_update',
            reference_id: parcelId,
            reference_type: 'parcel',
            created_for: user.id,
            metadata: {
              old_status: parcelData.status,
              new_status: newStatus,
              tracking_number: parcelData.tracking_number,
              recipient_name: parcelData.recipient_name,
              total_price: parcelData.total_price
            }
          });
        } catch (notifError) {
          console.error('Erreur lors de la création de la notification:', notifError);
          // Ne pas bloquer la mise à jour pour une erreur de notification
        }

        return updatedParcel;
      } catch (error) {
        console.error('Erreur globale:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Rafraîchir toutes les données pertinentes
      queryClient.invalidateQueries(['parcels']);
      queryClient.invalidateQueries(['statistics']);
      queryClient.invalidateQueries(['disputes']);
    },
    onError: (error) => {
      console.error('Erreur mutation:', error);
      createNotification({
        title: 'Erreur',
        message: error.message || 'Une erreur est survenue lors de la mise à jour du statut',
        type: 'error'
      });
    }
  });

  return {
    updateParcelStatus,
  };
}
