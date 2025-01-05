import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabaseClient';
import { useAuth } from '../context/AuthContext';

export function useCreateParcel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      if (!user) throw new Error('Vous devez être connecté pour créer un colis');

      // Appeler la fonction create_new_parcel
      const { data: newParcel, error: parcelError } = await supabase
        .rpc('create_new_parcel', {
          p_recipient_name: formData.recipient_name,
          p_recipient_phone: formData.recipient_phone,
          p_country: formData.country,
          p_created_by: user.id,
          p_recipient_id: formData.recipient_id || null,
          p_recipient_email: formData.recipient_email || null,
          p_recipient_address: formData.recipient_address || null,
          p_city: formData.city || null,
          p_postal_code: formData.postal_code || null,
          p_shipping_type: formData.shipping_type || 'Standard',
          p_weight: formData.weight ? Number(formData.weight) : 0,
          p_dimensions: formData.dimensions || null,
          p_description: formData.special_instructions || null,
          p_client_id: formData.client_id || null,
          p_client_reference: formData.client_reference || null
        });

      if (parcelError) throw parcelError;

      // 2. Upload des photos dans le dossier du colis
      if (formData.photos?.length > 0) {
        try {
          const photoPromises = formData.photos.map(async (photo) => {
            const fileExt = photo.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${newParcel.parcel_id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('parcel-photos')
              .upload(filePath, photo);

            if (uploadError) throw uploadError;

            return filePath;
          });

          await Promise.all(photoPromises);
        } catch (error) {
          console.error('Erreur lors de l\'upload des photos:', error);
          throw new Error('Erreur lors de l\'upload des photos');
        }
      }

      return newParcel;
    },

    onSuccess: () => {
      // Invalider et recharger les requêtes
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },

    onError: (error) => {
      console.error('Erreur lors de la création du colis:', error);
      throw error;
    }
  });
}
