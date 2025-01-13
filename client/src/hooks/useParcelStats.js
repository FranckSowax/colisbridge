import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabaseConfig';
import { format, startOfWeek, eachDayOfInterval, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export function useParcelStats() {
  const [stats, setStats] = useState({
    evolution: [],
    distribution: []
  });

  useEffect(() => {
    fetchInitialStats();
    const channel = subscribeToChanges();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchInitialStats = async () => {
    // Récupérer tous les colis
    const { data: parcels, error } = await supabase
      .from('parcels')
      .select('*')
      .order('created_at');

    if (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return;
    }

    updateStats(parcels);
  };

  const updateStats = (parcels) => {
    // Préparer les données pour l'évolution (7 derniers jours)
    const today = new Date();
    const last7Days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today
    });

    const evolution = last7Days.map(date => {
      const dayParcels = parcels.filter(p => 
        format(new Date(p.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );

      return {
        date: format(date, 'dd MMM', { locale: fr }),
        total: dayParcels.length,
        receptionne: dayParcels.filter(p => p.status === 'receptionne').length,
        expedie: dayParcels.filter(p => p.status === 'expedie').length,
        recu: dayParcels.filter(p => p.status === 'recu').length,
        litige: dayParcels.filter(p => p.status === 'litige').length
      };
    });

    // Préparer les données pour la distribution par statut
    const statusCounts = parcels.reduce((acc, parcel) => {
      acc[parcel.status] = (acc[parcel.status] || 0) + 1;
      return acc;
    }, {});

    const distribution = Object.entries(statusCounts).map(([status, count]) => ({
      status: getStatusLabel(status),
      count,
      percentage: (count / parcels.length * 100).toFixed(1)
    }));

    setStats({ evolution, distribution });
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'receptionne': 'Réceptionné',
      'expedie': 'Expédié',
      'recu': 'Reçu',
      'litige': 'En litige'
    };
    return statusMap[status] || status;
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('parcels-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'parcels' 
        }, 
        () => {
          fetchInitialStats();
        }
      )
      .subscribe();

    return channel;
  };

  return stats;
}
