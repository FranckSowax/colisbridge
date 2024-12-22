import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabaseClient';
import { useAuth } from '../context/AuthContext';

export function useCreateParcel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      if (!user) throw new Error('Vous devez être connecté pour créer un colis');

      let parcelData = {
        recipient_id: formData.recipient_id,
        country: formData.country,
        shipping_type: formData.shipping_type,
        special_instructions: formData.special_instructions,
        created_by: user.id,
        status: 'recu',
        tracking_number: `CB${Date.now()}${Math.floor(Math.random() * 1000)}`
      };

      // Ajout conditionnel du poids ou du CBM selon le type d'envoi
      if (['standard', 'express'].includes(formData.shipping_type)) {
        parcelData.weight = Number(formData.weight) || null;
      } else if (formData.shipping_type === 'maritime') {
        parcelData.cbm = Number(formData.cbm) || null;
      }

      // Upload photos
      const photoUrls = [];
      if (formData.photos?.length > 0) {
        try {
          for (const photo of formData.photos) {
            const fileExt = photo.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('parcel-photos')
              .upload(filePath, photo);

            if (uploadError) {
              console.error('Erreur upload photo:', uploadError);
              throw new Error(`Erreur lors de l'upload de la photo: ${uploadError.message}`);
            }

            const { data: { publicUrl } } = supabase.storage
              .from('parcel-photos')
              .getPublicUrl(filePath);

            photoUrls.push(publicUrl);
          }
        } catch (error) {
          console.error('Erreur lors du traitement des photos:', error);
          throw error;
        }
      }

      if (photoUrls.length > 0) {
        parcelData.photo_urls = photoUrls;
      }

      // Create parcel
      const { data, error } = await supabase
        .from('parcels')
        .insert([parcelData])
        .select()
        .single();

      if (error) {
        console.error('Erreur création colis:', error);
        throw new Error(`Erreur lors de la création du colis: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
    },
  });
}
