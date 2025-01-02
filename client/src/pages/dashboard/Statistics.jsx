import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartBarIcon, GlobeAltIcon, CurrencyEuroIcon, CubeIcon } from '@heroicons/react/24/outline';

// Liste des pays supportés
const SUPPORTED_COUNTRIES = ['Gabon', 'Togo', 'Cote d\'Ivoire', 'France', 'Dubai'];

export default function Statistics() {
  const { user } = useAuth();
  const [revenueData, setRevenueData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('6 derniers mois');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [completedRevenue, setCompletedRevenue] = useState(0);
  const [totalParcels, setTotalParcels] = useState(0);

  useEffect(() => {
    let channel;
    if (user?.id) {
      fetchStatistics();
      channel = subscribeToParcelUpdates();
    }
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [user, selectedPeriod]);

  const subscribeToParcelUpdates = () => {
    const channel = supabase
      .channel('parcel-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'parcels',
          filter: `created_by=eq.${user.id}`,
        },
        async (payload) => {
          if (payload.new.status === 'Terminé' && payload.old.status !== 'Terminé') {
            setCompletedRevenue(prev => prev + Number(payload.new.price || 0));
            await fetchStatistics();
          }
        }
      )
      .subscribe();

    return channel;
  };

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer les statistiques depuis la table statistics
      const { data: stats, error: statsError } = await supabase
        .from('statistics')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (statsError) {
        // Si les statistiques n'existent pas encore, on les initialise avec les données des colis
        if (statsError.code === 'PGRST116') {
          const { data: parcels, error: parcelsError } = await supabase
            .from('parcels')
            .select('created_at, price, status, destination_country')
            .eq('created_by', user.id)
            .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString());

          if (parcelsError) throw parcelsError;

          // Calculer les totaux
          const total = (parcels || []).reduce((acc, parcel) => {
            acc.revenue += Number(parcel.price) || 0;
            acc.parcels += 1;
            if (parcel.status === 'Terminé') {
              acc.completedRevenue += Number(parcel.price) || 0;
            }
            return acc;
          }, { revenue: 0, parcels: 0, completedRevenue: 0 });

          setTotalRevenue(total.revenue);
          setCompletedRevenue(total.completedRevenue);
          setTotalParcels(total.parcels);

          // Formater les données de chiffre d'affaires par mois
          const monthlyRevenue = (parcels || []).reduce((acc, parcel) => {
            if (!parcel?.created_at) return acc;
            
            const month = new Date(parcel.created_at).toLocaleString('fr-FR', { month: 'short' });
            if (!acc[month]) {
              acc[month] = {
                total: 0,
                completed: 0
              };
            }
            acc[month].total += Number(parcel.price) || 0;
            if (parcel.status === 'Terminé') {
              acc[month].completed += Number(parcel.price) || 0;
            }
            return acc;
          }, {});

          const formattedRevenueData = Object.entries(monthlyRevenue)
            .map(([month, amounts]) => ({
              month,
              amount: amounts.total || 0,
              completedAmount: amounts.completed || 0,
            }))
            .sort((a, b) => {
              const months = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
              return months.indexOf(a.month) - months.indexOf(b.month);
            });

          setRevenueData(formattedRevenueData);

          // Formater les données par pays
          const countryStats = SUPPORTED_COUNTRIES.reduce((acc, country) => {
            acc[country] = {
              parcels: 0,
              revenue: 0,
              completedRevenue: 0
            };
            return acc;
          }, {});

          parcels.forEach(parcel => {
            if (parcel?.destination_country && countryStats[parcel.destination_country]) {
              countryStats[parcel.destination_country].parcels += 1;
              countryStats[parcel.destination_country].revenue += Number(parcel.price) || 0;
              if (parcel.status === 'Terminé') {
                countryStats[parcel.destination_country].completedRevenue += Number(parcel.price) || 0;
              }
            }
          });

          const formattedCountryData = Object.entries(countryStats)
            .map(([country, data]) => ({
              country,
              ...data,
              growth: 0 // Pas de données historiques pour le moment
            }))
            .sort((a, b) => b.revenue - a.revenue);

          setCountryData(formattedCountryData);

          // Créer l'enregistrement initial dans la table statistics
          const { error: insertError } = await supabase
            .from('statistics')
            .insert({
              user_id: user.id,
              total_revenue: total.revenue,
              completed_revenue: total.completedRevenue,
              total_parcels: total.parcels,
              month_revenue: monthlyRevenue,
              country_stats: countryStats
            });

          if (insertError) throw insertError;
        } else {
          throw statsError;
        }
      } else {
        // Utiliser les statistiques existantes
        setTotalRevenue(stats.total_revenue);
        setCompletedRevenue(stats.completed_revenue);
        setTotalParcels(stats.total_parcels);

        // Formater les données de revenus
        const formattedRevenueData = Object.entries(stats.month_revenue || {})
          .map(([month, amounts]) => ({
            month,
            amount: amounts.total || 0,
            completedAmount: amounts.completed || 0,
          }))
          .sort((a, b) => {
            const months = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
            return months.indexOf(a.month) - months.indexOf(b.month);
          });

        setRevenueData(formattedRevenueData);

        // Formater les données par pays
        const formattedCountryData = Object.entries(stats.country_stats || {})
          .map(([country, data]) => ({
            country,
            ...data,
            growth: 0 // À calculer avec les données historiques
          }))
          .sort((a, b) => b.revenue - a.revenue);

        setCountryData(formattedCountryData);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600">
          Une erreur est survenue: {error}
        </div>
      </div>
    );
  }

  const currentMonthRevenue = revenueData[revenueData.length - 1]?.amount || 0;
  const previousMonthRevenue = revenueData[revenueData.length - 2]?.amount || 0;
  const revenueGrowth = previousMonthRevenue ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Chiffre d'affaires total */}
        <div className="bg-white overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyEuroIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Chiffre d'affaires total</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {totalRevenue.toLocaleString()} F CFA
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Chiffre d'affaires réalisé (Terminé) */}
        <div className="bg-white overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyEuroIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Chiffre d'affaires réalisé</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-green-600">
                      {completedRevenue.toLocaleString()} F CFA
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Nombre total de colis */}
        <div className="bg-white overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CubeIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Nombre total de colis</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {totalParcels.toLocaleString()}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Graphique Chiffre d'affaires */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900">Chiffre d'affaires</h2>
                <p className="text-sm text-gray-500">{selectedPeriod}</p>
              </div>
            </div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option>6 derniers mois</option>
              <option>12 derniers mois</option>
            </select>
          </div>
          <div className="h-80">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      const label = name === 'amount' ? 'Total' : 'Réalisé';
                      return [`${value.toLocaleString()} F CFA`, label];
                    }}
                  />
                  <Bar dataKey="amount" name="Total" fill="#9333EA" />
                  <Bar dataKey="completedAmount" name="Réalisé" fill="#22C55E" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Aucune donnée disponible
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <div>
              <p className="text-gray-500">Total du mois</p>
              <p className="text-xl font-semibold text-gray-900">
                {currentMonthRevenue.toLocaleString()} F CFA
              </p>
            </div>
            <div>
              <p className="text-gray-500">Croissance</p>
              <p className={`text-xl font-semibold ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Performance par pays */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <div className="bg-green-100 rounded-lg p-3">
              <GlobeAltIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">Performance par pays</h2>
              <p className="text-sm text-gray-500">Mois en cours</p>
            </div>
          </div>
          <div className="space-y-6">
            {countryData.length > 0 ? (
              countryData.map((country) => (
                <div key={country.country} className="flex items-center">
                  <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium">{country.country.substring(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900">{country.country}</h3>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          Réalisé: {country.completedRevenue.toLocaleString()} F CFA
                        </span>
                        <span className={`text-sm font-medium ${country.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {country.growth >= 0 ? '+' : ''}{country.growth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{country.parcels} colis</span>
                      <span>{country.revenue.toLocaleString()} F CFA</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (country.revenue / Math.max(...countryData.map(c => c.revenue || 0))) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
