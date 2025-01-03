import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabaseClient';

export function useNotifications() {
  const queryClient = useQueryClient();

  // Récupérer toutes les notifications
  const {
    data: notifications = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Marquer une notification comme lue
  const markAsRead = useMutation({
    mutationFn: async (notificationId) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  // Supprimer une notification
  const deleteNotification = useMutation({
    mutationFn: async (notificationId) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  // Obtenir le nombre de notifications non lues
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
