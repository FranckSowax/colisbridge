import { Fragment, useState } from 'react';
import { Dialog, Menu, Transition } from '@headlessui/react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  BellIcon,
  CalendarIcon,
  ChartBarIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
  ArchiveBoxIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  InboxIcon,
  TruckIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UserIcon,
  MenuIcon
} from '@heroicons/react/24/outline/index.js';
import { ParcelStats } from '@/components/parcels/ParcelStats';
import { ParcelLineChart } from '@/components/dashboard/ParcelLineChart';
import { ParcelBarChart } from '@/components/dashboard/ParcelBarChart';
import { ParcelCharts } from '@/components/dashboard/ParcelCharts';
import { RecentParcels } from '@/components/dashboard/RecentParcels';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { classNames } from '@/utils/classNames';
import NewParcelForm from '@/components/NewParcelForm';
import Sidebar from '../components/Sidebar';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
  { name: 'Colis', href: '/dashboard/parcels', icon: ArchiveBoxIcon },
  { name: 'Clients', href: '/dashboard/clients', icon: UsersIcon },
  { name: 'Litiges', href: '/dashboard/disputes', icon: ExclamationTriangleIcon },
  { name: 'Statistiques', href: '/dashboard/statistics', icon: ChartBarIcon },
  { name: 'Mon Profil', href: '/dashboard/profile', icon: UserIcon },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

const userNavigation = [
  { name: 'Mon profil', href: '/dashboard/profile', icon: UserIcon },
  { name: 'Déconnexion', href: '#', icon: ArrowRightOnRectangleIcon },
];

const timeRanges = [
  { name: 'Jour', value: 'day' },
  { name: 'Semaine', value: 'week' },
  { name: 'Mois', value: 'month' },
  { name: 'Année', value: 'year' },
];

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');
  const [isNewParcelModalOpen, setIsNewParcelModalOpen] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { toggleTheme, isDarkMode } = useTheme();
  const { data, loading, error } = useDashboardData();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleNewParcelSuccess = () => {
    setIsNewParcelModalOpen(false);
    // Optionnel : rafraîchir les données ou naviguer vers une autre page
  };

  const isCurrentPath = (path) => {
    return location.pathname === path || 
           (path !== '/dashboard' && location.pathname.startsWith(path));
  };

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Bouton hamburger pour mobile */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-20 p-2 rounded-md bg-white shadow-lg"
      >
        <MenuIcon className="h-6 w-6 text-gray-600" />
      </button>

      {/* Overlay sombre pour mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      {/* Barre latérale responsive */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <Sidebar />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <div className="flex flex-1 items-center justify-between">
                <div className="flex flex-1">
                  {/* Bouton de création de colis */}
                  <button
                    onClick={() => setIsNewParcelModalOpen(true)}
                    className="hidden sm:inline-flex ml-2 sm:ml-6 items-center gap-x-1 rounded-md bg-indigo-600 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    <PlusIcon className="-ml-0.5 h-4 sm:h-5 w-4 sm:w-5" aria-hidden="true" />
                    Créer un colis
                  </button>
                </div>
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                  <form className="relative flex flex-1" action="#" method="GET">
                    <label htmlFor="search-field" className="sr-only">
                      Search
                    </label>
                    <MagnifyingGlassIcon
                      className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
                      aria-hidden="true"
                    />
                    <input
                      id="search-field"
                      className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                      placeholder="Rechercher..."
                      type="search"
                      name="search"
                    />
                  </form>
                  <button
                    type="button"
                    className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">View notifications</span>
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                  </button>

                  <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

                  <Menu as="div" className="relative">
                    <Menu.Button className="-m-1.5 flex items-center p-1.5">
                      <span className="sr-only">Open user menu</span>
                      <img
                        className="h-8 w-8 rounded-full bg-gray-50"
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.email}`}
                        alt=""
                      />
                      <span className="hidden lg:flex lg:items-center">
                        <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                          {user?.name}
                        </span>
                        <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                      </span>
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                        {userNavigation.map((item) => (
                          <Menu.Item key={item.name}>
                            {({ active }) => (
                              <a
                                href={item.href}
                                className={classNames(
                                  active ? 'bg-gray-50' : '',
                                  'block px-3 py-1 text-sm leading-6 text-gray-900'
                                )}
                              >
                                {item.name}
                              </a>
                            )}
                          </Menu.Item>
                        ))}
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>
            </div>
          </div>

          {location.pathname === '/dashboard' ? (
            <>
              <div className="py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  {/* Stats */}
                  <ParcelStats />

                  {/* Charts */}
                  <ParcelCharts />

                  {/* Recent Parcels */}
                  <div className="mt-8">
                    <div className="bg-white shadow-lg rounded-lg">
                      <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Colis récents</h2>
                        <RecentParcels />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      {/* Bouton flottant pour mobile */}
      <button
        onClick={() => setIsNewParcelModalOpen(true)}
        className="fixed sm:hidden right-4 bottom-4 z-50 p-3 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <PlusIcon className="h-6 w-6" aria-hidden="true" />
        <span className="sr-only">Créer un colis</span>
      </button>

      <NewParcelForm
        isOpen={isNewParcelModalOpen}
        onClose={() => setIsNewParcelModalOpen(false)}
        onSuccess={handleNewParcelSuccess}
      />
    </div>
  );
}