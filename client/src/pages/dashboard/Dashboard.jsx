import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { EnvelopeIcon, PlusIcon } from '@heroicons/react/24/outline';
import NewParcelForm from '../../components/NewParcelForm';

const STATUS_CARDS = [
  {
    name: 'Colis reçus',
    status: 'recu',
    icon: '📥',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    hoverColor: 'hover:bg-blue-100'
  },
  {
    name: 'Colis expédiés',
    status: 'expedie',
    icon: '📤',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    hoverColor: 'hover:bg-indigo-100'
  },
  {
    name: 'Colis réceptionnés',
    status: 'receptionne',
    icon: '✅',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    hoverColor: 'hover:bg-green-100'
  },
  {
    name: 'Colis terminés',
    status: 'termine',
    icon: '🏁',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    hoverColor: 'hover:bg-gray-100'
  },
  {
    name: 'Colis en litige',
    status: 'litige',
    icon: '⚠️',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    hoverColor: 'hover:bg-yellow-100'
  }
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalParcels: 0,
    statusCounts: {}
  });
  const [isNewParcelFormOpen, setIsNewParcelFormOpen] = useState(false);

  const fetchStats = async () => {
    try {
      // Récupérer le nombre total de colis
      const { count: totalParcels, error: totalError } = await supabase
        .from('parcels')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Récupérer le nombre de colis par statut
      const { data: statusData, error: statusError } = await supabase
        .from('parcels')
        .select('status');

      if (statusError) throw statusError;

      // Compter les colis par statut
      const statusCounts = statusData.reduce((acc, parcel) => {
        acc[parcel.status] = (acc[parcel.status] || 0) + 1;
        return acc;
      }, {});

      setStats({
        totalParcels: totalParcels || 0,
        statusCounts
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
      
      // Souscrire aux changements en temps réel
      const parcelSubscription = supabase
        .channel('parcels-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'parcels' },
          () => {
            fetchStats();
          }
        )
        .subscribe();

      return () => {
        parcelSubscription.unsubscribe();
      };
    }
  }, [user]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Tableau de bord</h1>
          <p className="mt-2 text-sm text-gray-700">
            Vue d'ensemble de vos colis et clients.
          </p>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total des colis */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EnvelopeIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total des colis</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalParcels}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/dashboard/filtered-parcels" className="font-medium text-blue-700 hover:text-blue-900">
                Voir tous les colis
              </Link>
            </div>
          </div>
        </div>

        {/* Cartes de statut */}
        {STATUS_CARDS.map((card) => (
          <div key={card.status} className={`overflow-hidden shadow rounded-lg ${card.bgColor}`}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl" role="img" aria-label={card.name}>
                    {card.icon}
                  </span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{card.name}</dt>
                    <dd className={`text-lg font-medium ${card.textColor}`}>
                      {stats.statusCounts[card.status] || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className={`${card.bgColor} px-5 py-3 ${card.hoverColor}`}>
              <div className="text-sm">
                <Link
                  to={card.status === 'litige' 
                    ? '/dashboard/litiges'
                    : `/dashboard/filtered-parcels?status=${card.status}`}
                  className={`font-medium ${card.textColor}`}
                >
                  Voir les détails
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions rapides */}
      <section aria-labelledby="quick-actions-title" className="mt-8">
        <h2 id="quick-actions-title" className="text-lg font-medium text-gray-900">
          Actions rapides
        </h2>
        <div className="mt-4 divide-y divide-gray-200 bg-white shadow sm:grid sm:grid-cols-2 sm:gap-px sm:divide-y-0">
          <button
            onClick={() => setIsNewParcelFormOpen(true)}
            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 hover:bg-gray-50 rounded-lg"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                <PlusIcon className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium text-left">
                <span className="absolute inset-0" aria-hidden="true" />
                Créer un nouveau colis
              </h3>
              <p className="mt-2 text-sm text-gray-500 text-left">
                Enregistrer un nouveau colis dans le système
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Formulaire de création de colis */}
      <NewParcelForm
        isOpen={isNewParcelFormOpen}
        onClose={() => setIsNewParcelFormOpen(false)}
        onSuccess={() => {
          setIsNewParcelFormOpen(false);
          fetchStats();
        }}
      />
    </div>
  );
}
