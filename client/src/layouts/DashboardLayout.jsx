import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLanguage } from '@contexts/LanguageContext';
import Navbar from '@components/Navbar';
import { 
  HomeIcon, 
  UsersIcon, 
  ChartBarIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function DashboardLayout() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { t, loading: langLoading } = useLanguage();
  const [error, setError] = useState(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error(t('errors.signout_failed'));
    }
  };

  const navigation = [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: HomeIcon },
    { name: t('navigation.parcels'), href: '/dashboard/parcels', icon: ArchiveBoxIcon },
    { name: t('navigation.clients'), href: '/dashboard/clients', icon: UsersIcon },
    { name: t('navigation.statistics'), href: '/dashboard/statistics', icon: ChartBarIcon },
    { name: t('navigation.disputes'), href: '/dashboard/disputes', icon: ExclamationTriangleIcon },
  ];

  const userNavigation = [
    { name: t('navigation.profile'), href: '/dashboard/profile' },
    { name: t('navigation.settings'), href: '/dashboard/settings' },
    { name: t('navigation.logout'), onClick: handleSignOut }
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!authLoading && !user) {
          navigate('/login', { replace: true });
        }
      } catch (err) {
        setError(err);
        toast.error(t('errors.auth_check_failed'));
      }
    };

    checkAuth();
  }, [user, authLoading, navigate, t]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {t('errors.something_went_wrong')}
          </h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            {t('actions.refresh')}
          </button>
        </div>
      </div>
    );
  }

  if (authLoading || langLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">{t('loading.please_wait')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans antialiased">
      <Navbar navigation={navigation} userNavigation={userNavigation} />
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}