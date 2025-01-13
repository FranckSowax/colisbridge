import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLanguage } from '@contexts/LanguageContext';
import { supabase } from '@/config/supabaseClient';
import { PlusIcon } from '@heroicons/react/24/outline/index.js';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import NewParcelForm from '@components/NewParcelForm';
import { ErrorBoundary } from 'react-error-boundary';

const STATUS_CARDS = [
  {
    name: 'dashboard.status.recu',
    status: 'recu',
    icon: '📥',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    hoverColor: 'hover:bg-blue-100'
  },
  {
    name: 'dashboard.status.expedie',
    status: 'expedie',
    icon: '📤',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    hoverColor: 'hover:bg-indigo-100'
  },
  {
    name: 'dashboard.status.termine',
    status: 'termine',
    icon: '✅',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    hoverColor: 'hover:bg-green-100'
  },
  {
    name: 'dashboard.status.litige',
    status: 'litige',
    icon: '⚠️',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    hoverColor: 'hover:bg-yellow-100'
  }
];

function ErrorFallback({ error, resetErrorBoundary }) {
  const { t } = useLanguage();
  return (
    <div className="p-4 bg-red-50 rounded-lg" role="alert">
      <h2 className="text-lg font-semibold text-red-800 mb-2">{t('errors.something_went_wrong')}</h2>
      <pre className="text-sm text-red-700 mb-4">{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        {t('actions.try_again')}
      </button>
    </div>
  );
}

const Dashboard = () => {
  const { user } = useAuth();
  const { t, loading: langLoading } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [recentParcels, setRecentParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNewParcelModalOpen, setIsNewParcelModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        throw new Error(t('errors.not_authenticated'));
      }

      const { data: statsData, error: statsError } = await supabase
        .from('parcels_view')
        .select('status')
        .eq('created_by', user.id);

      if (statsError) throw statsError;

      const calculatedStats = statsData.reduce((acc, parcel) => {
        acc[parcel.status] = (acc[parcel.status] || 0) + 1;
        return acc;
      }, {});

      setStats(calculatedStats);

      const { data: parcelsData, error: parcelsError } = await supabase
        .from('parcels_view')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (parcelsError) throw parcelsError;

      setRecentParcels(parcelsData);
    } catch (err) {
      console.error('Erreur lors du chargement du tableau de bord:', err);
      setError(err.message);
      toast.error(t('errors.loading_failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!langLoading) {
      fetchDashboardData();
    }
  }, [user, t, langLoading]);

  const handleNewParcelSuccess = () => {
    setIsNewParcelModalOpen(false);
    toast.success(t('success.parcel_created'));
    fetchDashboardData();
  };

  if (loading || langLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-600">{t('loading.dashboard_data')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            {t('errors.dashboard_loading_failed')}
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {t('actions.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        {STATUS_CARDS.map((card) => (
          <div
            key={card.status}
            className={`${card.bgColor} ${card.hoverColor} rounded-lg p-6 cursor-pointer transition-colors duration-200`}
            onClick={() => navigate('/dashboard/parcels', { state: { status: card.status } })}
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">{card.icon}</span>
              <div>
                <p className={`text-sm font-medium ${card.textColor}`}>
                  {t(card.name)}
                </p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">
                  {stats[card.status] || 0}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 p-4">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold">Mes Colis</h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsNewParcelModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span>{t('actions.create_parcel')}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {recentParcels.map((parcel) => (
                  <li key={parcel.id}>
                    <Link
                      to={`/dashboard/parcel-details/${parcel.id}`}
                      className="block hover:bg-gray-50"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="truncate">
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              {parcel.tracking_number}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              {format(new Date(parcel.created_at), 'PPP', { locale: fr })}
                            </p>
                          </div>
                          <div className="ml-2 flex-shrink-0">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              parcel.status === 'recu' ? 'bg-green-100 text-green-800' :
                              parcel.status === 'expedie' ? 'bg-blue-100 text-blue-800' :
                              parcel.status === 'termine' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {t(`dashboard.status.${parcel.status}`)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          setIsNewParcelModalOpen(false);
        }}
      >
        <NewParcelForm
          isOpen={isNewParcelModalOpen}
          onClose={() => setIsNewParcelModalOpen(false)}
          onSuccess={handleNewParcelSuccess}
        />
      </ErrorBoundary>
    </div>
  );
};

export default Dashboard;
