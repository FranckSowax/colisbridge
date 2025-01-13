import { useEffect, useState } from 'react';
import { supabase } from '@/config/supabaseConfig';
import { 
  ArchiveBoxIcon, 
  TruckIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

export function ParcelStats() {
  const [stats, setStats] = useState({
    recu: 0,
    expedie: 0,
    receptionne: 0,
    litige: 0,
    total: 0
  });

  useEffect(() => {
    fetchParcelStats();
  }, []);

  async function fetchParcelStats() {
    try {
      const { data: parcels, error } = await supabase
        .from('parcels')
        .select('status');

      if (error) throw error;

      const stats = parcels.reduce((acc, parcel) => {
        acc.total++;
        switch (parcel.status?.toLowerCase()) {
          case 'recu':
            acc.recu++;
            break;
          case 'expedie':
          case 'expédié':
            acc.expedie++;
            break;
          case 'receptionne':
          case 'réceptionné':
            acc.receptionne++;
            break;
          case 'litige':
            acc.litige++;
            break;
        }
        return acc;
      }, {
        recu: 0,
        expedie: 0,
        receptionne: 0,
        litige: 0,
        total: 0
      });

      setStats(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  }

  const statCards = [
    {
      name: 'Colis reçus',
      value: stats.recu,
      total: stats.total,
      icon: ArchiveBoxIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'Colis expédiés',
      value: stats.expedie,
      total: stats.total,
      icon: TruckIcon,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      name: 'Colis réceptionnés',
      value: stats.receptionne,
      total: stats.total,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      name: 'Litiges',
      value: stats.litige,
      total: stats.total,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {statCards.map((stat) => (
        <div
          key={stat.name}
          className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
        >
          <dt>
            <div className={`absolute rounded-md ${stat.bgColor} p-3`}>
              <stat.icon
                className={`h-6 w-6 ${stat.textColor}`}
                aria-hidden="true"
              />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">
              {stat.name}
            </p>
          </dt>
          <dd className="ml-16 flex items-baseline pb-6">
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            <p className="ml-2 text-sm text-gray-500">
              sur {stat.total} colis
            </p>
          </dd>
          <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <span className={`font-medium ${stat.textColor}`}>
                {((stat.value / stat.total) * 100).toFixed(1)}% du total
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
