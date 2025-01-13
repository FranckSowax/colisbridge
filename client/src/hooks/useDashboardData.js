import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabaseConfig';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function useDashboardData() {
  const [stats, setStats] = useState({
    total: 0,
    received: 0,
    shipped: 0,
    completed: 0,
    disputed: 0
  });
  const [trends, setTrends] = useState({});
  const [monthlyData, setMonthlyData] = useState([]);
  const [destinationData, setDestinationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Obtenir les dates pour la comparaison hebdomadaire
        const now = new Date();
        const currentWeekStart = startOfWeek(now, { locale: fr });
        const currentWeekEnd = endOfWeek(now, { locale: fr });
        const lastWeekStart = startOfWeek(subWeeks(now, 1), { locale: fr });
        const lastWeekEnd = endOfWeek(subWeeks(now, 1), { locale: fr });

        // Récupérer les statistiques actuelles
        const { data: currentStats, error: statsError } = await supabase
          .from('parcels')
          .select('status', { count: 'exact' })
          .gt('created_at', currentWeekStart.toISOString())
          .lt('created_at', currentWeekEnd.toISOString());

        if (statsError) throw statsError;

        // Récupérer les statistiques de la semaine dernière pour les tendances
        const { data: lastWeekStats, error: trendsError } = await supabase
          .from('parcels')
          .select('status', { count: 'exact' })
          .gt('created_at', lastWeekStart.toISOString())
          .lt('created_at', lastWeekEnd.toISOString());

        if (trendsError) throw trendsError;

        // Calculer les statistiques et les tendances
        const currentCounts = currentStats.reduce((acc, curr) => {
          acc[curr.status] = (acc[curr.status] || 0) + 1;
          return acc;
        }, {});

        const lastWeekCounts = lastWeekStats.reduce((acc, curr) => {
          acc[curr.status] = (acc[curr.status] || 0) + 1;
          return acc;
        }, {});

        // Calculer les pourcentages de changement
        const calculateTrend = (current, last) => {
          if (last === 0) return current > 0 ? '+100%' : '0%';
          const change = ((current - last) / last) * 100;
          return `${change > 0 ? '+' : ''}${change.toFixed(0)}%`;
        };

        const trends = {
          received: calculateTrend(currentCounts.received || 0, lastWeekCounts.received || 0),
          shipped: calculateTrend(currentCounts.shipped || 0, lastWeekCounts.shipped || 0),
          completed: calculateTrend(currentCounts.completed || 0, lastWeekCounts.completed || 0),
          disputed: calculateTrend(currentCounts.disputed || 0, lastWeekCounts.disputed || 0),
        };

        // Récupérer les données mensuelles pour le graphique linéaire
        const { data: monthlyStats, error: monthlyError } = await supabase
          .from('parcels')
          .select('created_at, status')
          .order('created_at', { ascending: true });

        if (monthlyError) throw monthlyError;

        // Formater les données mensuelles
        const monthlyData = monthlyStats.reduce((acc, curr) => {
          const month = format(new Date(curr.created_at), 'MMM yyyy', { locale: fr });
          const monthEntry = acc.find(entry => entry.month === month) || {
            month,
            received: 0,
            shipped: 0,
            completed: 0,
            disputed: 0
          };
          
          monthEntry[curr.status]++;
          
          if (!acc.find(entry => entry.month === month)) {
            acc.push(monthEntry);
          }
          
          return acc;
        }, []);

        // Récupérer les données de destination pour le graphique à barres
        const { data: destinationStats, error: destinationError } = await supabase
          .from('parcels')
          .select('country')
          .not('country', 'is', null);

        if (destinationError) throw destinationError;

        const destinationCounts = destinationStats.reduce((acc, curr) => {
          acc[curr.country] = (acc[curr.country] || 0) + 1;
          return acc;
        }, {});

        const destinationData = Object.entries(destinationCounts).map(([country, count]) => ({
          country,
          count
        }));

        setStats(currentCounts);
        setTrends(trends);
        setMonthlyData(monthlyData);
        setDestinationData(destinationData);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return {
    stats,
    trends,
    monthlyData,
    destinationData,
    loading,
    error
  };
}
