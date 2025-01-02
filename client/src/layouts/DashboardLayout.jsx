import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import { 
  HomeIcon, 
  UsersIcon, 
  ChartBarIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

export function DashboardLayout() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigation = [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: HomeIcon },
    { name: t('navigation.parcels'), href: '/dashboard/parcels', icon: ArchiveBoxIcon },
    { name: t('navigation.clients'), href: '/dashboard/clients', icon: UsersIcon },
    { name: t('navigation.statistics'), href: '/dashboard/statistics', icon: ChartBarIcon },
  ];

  const userNavigation = [
    { name: t('navigation.profile'), href: '/dashboard/profile' },
    { name: t('navigation.settings'), href: '/dashboard/settings' },
    { name: t('navigation.logout'), onClick: handleSignOut }
  ];

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar navigation={navigation} userNavigation={userNavigation} />
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}