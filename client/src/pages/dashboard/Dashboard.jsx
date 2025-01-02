import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { EnvelopeIcon, PlusIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import NewParcelForm from '../../components/NewParcelForm';
import MobileNavBar from '../../components/MobileNavBar';
import QuickActions from '../../components/QuickActions';
import { useSwipeable } from 'react-swipeable';

const STATUS_CARDS = [
  {
    name: 'Reçus',
    status: 'recu',
    icon: '📥',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    hoverColor: 'hover:bg-blue-100'
  },
  {
    name: 'Expédiés',
    status: 'expedie',
    icon: '📤',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    hoverColor: 'hover:bg-indigo-100'
  },
  {
    name: 'Terminés',
    status: 'termine',
    icon: '✅',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    hoverColor: 'hover:bg-green-100'
  },
  {
    name: 'En litige',
    status: 'litige',
    icon: '⚠️',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    hoverColor: 'hover:bg-yellow-100'
  }
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalParcels: 0,
    statusCounts: {}
  });
  const [recentParcels, setRecentParcels] = useState([]);
  const [isNewParcelFormOpen, setIsNewParcelFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Pull-to-refresh handler
  const handlers = useSwipeable({
    onSwipedDown: (eventData) => {
      if (eventData.deltaY > 100) {
        handleRefresh();
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: parcels, error: parcelsError } = await supabase
        .from('parcels')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (parcelsError) throw parcelsError;

      const statusCounts = parcels.reduce((acc, parcel) => {
        acc[parcel.status] = (acc[parcel.status] || 0) + 1;
        return acc;
      }, {});

      setStats({
        totalParcels: parcels.length,
        statusCounts
      });

      setRecentParcels(parcels.slice(0, 5));
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 border border-red-200">
        <p className="text-sm text-red-600">Erreur: {error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-2 text-sm text-red-600 hover:text-red-500"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" {...handlers}>
      {/* Indicateur de rafraîchissement */}
      {refreshing && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-primary-600 animate-pulse" />
      )}

      {/* Header fixe pour mobile */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                Tableau de bord
              </h1>
              <p className="mt-1 text-sm text-gray-500 hidden sm:block">
                Bienvenue, {user?.email}
              </p>
            </div>
            <div className="hidden sm:block">
              <button
                onClick={() => setIsNewParcelFormOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Nouveau Colis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 pb-20 sm:pb-6">
        {/* Cartes de statistiques */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {/* Total des colis */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <EnvelopeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                </div>
                <div className="ml-3 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total</dt>
                    <dd className="text-lg sm:text-xl font-semibold text-gray-900">{stats.totalParcels}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-2">
              <Link 
                to="/dashboard/parcels" 
                className="text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-800"
              >
                Voir tous
              </Link>
            </div>
          </div>

          {/* Cartes de statut */}
          {STATUS_CARDS.map((card) => (
            <div key={card.status} className={`rounded-lg shadow-sm overflow-hidden ${card.bgColor}`}>
              <div className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-xl sm:text-2xl" role="img" aria-label={card.name}>
                      {card.icon}
                    </span>
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <dl>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                        {card.name}
                      </dt>
                      <dd className={`text-lg sm:text-xl font-semibold ${card.textColor}`}>
                        {stats.statusCounts[card.status] || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className={`${card.bgColor} px-4 py-2 ${card.hoverColor}`}>
                <Link
                  to={card.status === 'litige' ? '/dashboard/litiges' : `/dashboard/filtered-parcels?status=${card.status}`}
                  className={`text-xs sm:text-sm font-medium ${card.textColor}`}
                >
                  Voir détails
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Liste des colis récents */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-medium text-gray-900">Colis récents</h2>
            <Link
              to="/dashboard/parcels"
              className="mt-3 sm:mt-0 text-sm font-medium text-primary-600 hover:text-primary-800"
            >
              Voir tous les colis
            </Link>
          </div>
          
          {/* Liste scrollable sur mobile */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                {recentParcels.map((parcel) => (
                  <div
                    key={parcel.id}
                    className="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/parcels/${parcel.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {parcel.tracking_number}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {format(new Date(parcel.created_at), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${parcel.status === 'Terminé' ? 'bg-green-100 text-green-800' :
                        parcel.status === 'En cours' ? 'bg-blue-100 text-blue-800' :
                        parcel.status === 'Litige' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'}`}
                      >
                        {parcel.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation mobile et actions rapides */}
      <MobileNavBar />
      <QuickActions onNewParcel={() => setIsNewParcelFormOpen(true)} />

      {/* Modal de nouveau colis */}
      <NewParcelForm
        isOpen={isNewParcelFormOpen}
        onClose={() => setIsNewParcelFormOpen(false)}
        onSuccess={() => {
          setIsNewParcelFormOpen(false);
          fetchDashboardData();
        }}
      />
    </div>
  );
}
