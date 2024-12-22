import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabaseClient';
import { useAuth } from '../context/AuthContext';

export function useCreateRecipient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipientData) => {
      if (!user) throw new Error('Vous devez être connecté pour ajouter un destinataire');

      const { data, error } = await supabase
        .from('recipients')
        .insert([{
          name: recipientData.name,
          email: recipientData.email,
          phone: recipientData.phone,
          address: recipientData.address,
          created_by: user.id
        }])
        .select('id, name, phone')
        .single();

      if (error) {
        console.error('Erreur création destinataire:', error);
        throw new Error(`Erreur lors de la création du destinataire: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipients'] });
    },
  });
}
