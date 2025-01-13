import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  UsersIcon,
  ArchiveBoxIcon,
  GlobeEuropeAfricaIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

export function ClientStats() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalParcels: 0,
    totalCountries: 0,
    totalCompanies: 0
  });

  useEffect(() => {
    fetchClientStats();
  }, []);

  async function fetchClientStats() {
    try {
      const { data: parcels, error } = await supabase
        .from('parcels')
        .select('recipient_name, recipient_email, country');

      if (error) throw error;

      // Calculer les statistiques
      const uniqueClients = new Set();
      const uniqueCountries = new Set();
      const uniqueCompanies = new Set();

      parcels.forEach(parcel => {
        // Identifiant unique pour chaque client (email)
        uniqueClients.add(parcel.recipient_email);
        
        // Pays uniques
        if (parcel.country) {
          uniqueCountries.add(parcel.country);
        }

        // Entreprises (si le nom contient SARL, SA, SAS, etc.)
        const companyIdentifiers = ['SARL', 'SA', 'SAS', 'EURL', 'SASU'];
        if (companyIdentifiers.some(identifier => 
          parcel.recipient_name?.toUpperCase().includes(identifier)
        )) {
          uniqueCompanies.add(parcel.recipient_name);
        }
      });

      setStats({
        totalClients: uniqueClients.size,
        totalParcels: parcels.length,
        totalCountries: uniqueCountries.size,
        totalCompanies: uniqueCompanies.size
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  }

  const statCards = [
    {
      name: 'Total Clients',
      value: stats.totalClients,
      icon: UsersIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'Total Colis',
      value: stats.totalParcels,
      icon: ArchiveBoxIcon,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      name: 'Pays Desservis',
      value: stats.totalCountries,
      icon: GlobeEuropeAfricaIcon,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      name: 'Entreprises',
      value: stats.totalCompanies,
      icon: BuildingOfficeIcon,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <div
          key={stat.name}
          className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
        >
          <dt>
            <div className={`absolute rounded-md ${stat.bgColor} p-3`}>
              <stat.icon className={`h-6 w-6 ${stat.textColor}`} aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">{stat.name}</p>
          </dt>
          <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
          </dd>
        </div>
      ))}
    </div>
  );
}
