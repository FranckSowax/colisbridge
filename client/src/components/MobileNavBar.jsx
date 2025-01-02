import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  InboxIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Accueil', href: '/dashboard', icon: HomeIcon },
  { name: 'Colis', href: '/dashboard/parcels', icon: InboxIcon },
  { name: 'Clients', href: '/dashboard/clients', icon: UserGroupIcon },
  { name: 'Stats', href: '/dashboard/statistics', icon: ChartBarIcon },
  { name: 'Litiges', href: '/dashboard/litiges', icon: ExclamationTriangleIcon },
];

export default function MobileNavBar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Barre de navigation fixe en bas */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 sm:hidden">
        <div className="max-w-md mx-auto px-4">
          <div className="flex justify-around">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center py-2 px-1 ${
                    isActive
                      ? 'text-primary-600'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`h-6 w-6 ${
                      isActive ? 'text-primary-600' : 'text-gray-400'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="mt-1 text-xs">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Marge en bas pour éviter que le contenu ne soit caché par la barre de navigation */}
      <div className="h-16 sm:hidden" />
    </>
  );
}
