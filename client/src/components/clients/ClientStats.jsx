import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  UsersIcon,
  ArchiveBoxIcon,
  GlobeEuropeAfricaIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline/index.js';

export default function ClientStats() {
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
      console.error('Error fetching client stats:', error);
    }
  }

  const stats_items = [
    {
      name: 'Total Clients',
      value: stats.totalClients,
      icon: UsersIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Total Colis',
      value: stats.totalParcels,
      icon: ArchiveBoxIcon,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      name: 'Total Pays',
      value: stats.totalCountries,
      icon: GlobeEuropeAfricaIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      name: 'Total Entreprises',
      value: stats.totalCompanies,
      icon: BuildingOfficeIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats_items.map((item) => (
        <div
          key={item.name}
          className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
        >
          <dt>
            <div className={`absolute rounded-md ${item.bgColor} p-3`}>
              <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
          </dt>
          <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
            <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
          </dd>
        </div>
      ))}
    </dl>
  );
}
