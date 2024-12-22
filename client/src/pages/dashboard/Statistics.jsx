import { useState, useEffect } from 'react';
import { supabase } from '@config/supabaseClient';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CubeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

export default function Statistics() {
  const [stats, setStats] = useState({
    monthlyParcels: 0,
    revenue: 0,
    activeDisputes: 0,
    newClients: 0,
    monthlyGrowth: 0,
    disputesGrowth: 0,
    clientsGrowth: 0,
    revenueData: [],
    countryPerformance: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('6');

  useEffect(() => {
    fetchStats();
  }, [selectedPeriod]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(new Date());
      const prevStartDate = startOfMonth(subMonths(new Date(), 1));

      // Récupérer les paramètres de tarification
      const { data: settings } = await supabase
        .from('settings')
        .select('*')
        .single();

      // Récupérer les colis du mois en cours
      const { data: currentMonthParcels } = await supabase
        .from('parcels')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Récupérer les colis du mois précédent
      const { data: prevMonthParcels } = await supabase
        .from('parcels')
        .select('*')
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // Calculer le chiffre d'affaires
      const calculateRevenue = (parcels) => {
        return parcels.reduce((total, parcel) => {
          const countryTarifs = settings?.tarifs?.[parcel.destination_country] || {
            standard: 5000,
            express: 7500,
            cbm: 150000
          };
          
          const tarif = parcel.shipping_type === 'express' 
            ? countryTarifs.express 
            : countryTarifs.standard;

          if (parcel.weight) {
            total += parcel.weight * tarif;
          }
          if (parcel.dimensions) {
            const dimensions = parcel.dimensions.split('x').map(Number);
            if (dimensions.length === 3) {
              const cbm = (dimensions[0] * dimensions[1] * dimensions[2]) / 1000000;
              total += cbm * countryTarifs.cbm;
            }
          }
          return total;
        }, 0);
      };

      const currentRevenue = calculateRevenue(currentMonthParcels || []);
      const prevRevenue = calculateRevenue(prevMonthParcels || []);

      // Récupérer les litiges actifs
      const { data: disputes } = await supabase
        .from('disputes')
        .select('*')
        .neq('status', 'resolved');

      // Récupérer les nouveaux clients
      const { data: newClients } = await supabase
        .from('recipients')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Calculer les performances par pays
      const countryStats = {};
      currentMonthParcels?.forEach(parcel => {
        if (!countryStats[parcel.destination_country]) {
          countryStats[parcel.destination_country] = {
            count: 0,
            revenue: 0
          };
        }
        countryStats[parcel.destination_country].count += 1;
        countryStats[parcel.destination_country].revenue += calculateRevenue([parcel]);
      });

      const countryPerformance = Object.entries(countryStats).map(([country, data]) => ({
        country,
        count: data.count,
        revenue: data.revenue,
        growth: ((data.count - (prevMonthParcels?.filter(p => p.destination_country === country).length || 0)) / 
                (prevMonthParcels?.filter(p => p.destination_country === country).length || 1) * 100).toFixed(1)
      }));

      setStats({
        monthlyParcels: currentMonthParcels?.length || 0,
        revenue: currentRevenue,
        activeDisputes: disputes?.length || 0,
        newClients: newClients?.length || 0,
        monthlyGrowth: ((currentMonthParcels?.length || 0) - (prevMonthParcels?.length || 0)) / (prevMonthParcels?.length || 1) * 100,
        revenueGrowth: ((currentRevenue - prevRevenue) / prevRevenue) * 100,
        disputesGrowth: 0,
        clientsGrowth: 12,
        countryPerformance
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur lors du chargement des statistiques</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Statistiques</h1>
          <p className="mt-2 text-sm text-gray-700">
            Vue d'ensemble des performances et indicateurs clés
          </p>
        </div>
      </div>

      {/* Cartes statistiques principales */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Colis du mois */}
        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6">
          <dt>
            <div className="absolute rounded-md bg-blue-100 p-3">
              <CubeIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">Colis du mois</p>
          </dt>
          <dd className="ml-16 flex flex-col">
            <p className="text-2xl font-semibold text-gray-900">{stats.monthlyParcels}</p>
            <div className="flex items-baseline">
              <p className={`text-sm font-semibold ${stats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}%
              </p>
            </div>
          </dd>
        </div>

        {/* Chiffre d'affaires */}
        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6">
          <dt>
            <div className="absolute rounded-md bg-green-100 p-3">
              <ChartBarIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">Chiffre d'Affaires</p>
          </dt>
          <dd className="ml-16 flex flex-col">
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900 truncate">
                {formatCurrency(stats.revenue)}
              </p>
            </div>
            <p className={`text-sm font-semibold ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth.toFixed(1)}%
            </p>
          </dd>
        </div>

        {/* Litiges actifs */}
        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6">
          <dt>
            <div className="absolute rounded-md bg-red-100 p-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">Litiges Actifs</p>
          </dt>
          <dd className="ml-16 flex flex-col">
            <p className="text-2xl font-semibold text-gray-900">{stats.activeDisputes}</p>
            <div className="flex items-baseline">
              <p className="text-sm font-semibold text-red-600">
                {stats.disputesGrowth > 0 && '+'}{stats.disputesGrowth}
              </p>
            </div>
          </dd>
        </div>

        {/* Nouveaux clients */}
        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6">
          <dt>
            <div className="absolute rounded-md bg-purple-100 p-3">
              <UsersIcon className="h-6 w-6 text-purple-600" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">Nouveaux Clients</p>
          </dt>
          <dd className="ml-16 flex flex-col">
            <p className="text-2xl font-semibold text-gray-900">{stats.newClients}</p>
            <div className="flex items-baseline">
              <p className="text-sm font-semibold text-green-600">
                +{stats.clientsGrowth}%
              </p>
            </div>
          </dd>
        </div>
      </div>

      {/* Performance par pays */}
      <div className="mt-8">
        <h2 className="text-base font-semibold leading-6 text-gray-900">Performance par pays</h2>
        <p className="mt-2 text-sm text-gray-700">Mois en cours</p>
        <div className="mt-4">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Pays</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Colis</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Chiffre d'affaires</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Croissance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {stats.countryPerformance.map((country) => (
                  <tr key={country.country}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {country.country}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {country.count} colis
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatCurrency(country.revenue)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        parseFloat(country.growth) >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {country.growth >= 0 ? '+' : ''}{country.growth}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
