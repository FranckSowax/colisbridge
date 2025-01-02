import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabaseClient';
import { useAuth } from '../context/AuthContext';

export function useCreateParcel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      if (!user) throw new Error('Vous devez être connecté pour créer un colis');

      // 1. Créer d'abord le colis pour avoir son ID
      const trackingNumber = `CB${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      let parcelData = {
        recipient_id: formData.recipient_id,
        country: formData.country,
        shipping_type: formData.shipping_type,
        special_instructions: formData.special_instructions,
        created_by: user.id,
        status: 'recu',
        tracking_number: trackingNumber
      };

      // Ajout conditionnel du poids ou du CBM selon le type d'envoi
      if (['standard', 'express'].includes(formData.shipping_type)) {
        parcelData.weight = Number(formData.weight) || null;
      } else if (formData.shipping_type === 'maritime') {
        parcelData.cbm = Number(formData.cbm) || null;
      }

      // Créer le colis
      const { data: newParcel, error: parcelError } = await supabase
        .from('parcels')
        .insert(parcelData)
        .select()
        .single();

      if (parcelError) throw parcelError;

      // 2. Upload des photos dans le dossier du colis
      if (formData.photos?.length > 0) {
        try {
          const photoPromises = formData.photos.map(async (photo) => {
            const fileExt = photo.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${newParcel.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('parcel-photos')
              .upload(filePath, photo);

            if (uploadError) {
              console.error('Erreur upload photo:', uploadError);
              throw new Error(`Erreur lors de l'upload de la photo: ${uploadError.message}`);
            }

            return filePath;
          });

          await Promise.all(photoPromises);
        } catch (error) {
          // Si l'upload échoue, on supprime le colis
          await supabase.from('parcels').delete().eq('id', newParcel.id);
          throw new Error(`Erreur lors de l'upload des photos: ${error.message}`);
        }
      }

      return newParcel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parcels']);
    },
    onError: (error) => {
      console.error('Erreur mutation:', error);
      throw error;
    }
  });
}
