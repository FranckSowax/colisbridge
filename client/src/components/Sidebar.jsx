import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  BoxIcon, 
  UsersIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline/index.js';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
  { name: 'Colis', href: '/dashboard/parcels', icon: BoxIcon },
  { name: 'Clients', href: '/dashboard/customers', icon: UsersIcon },
  { name: 'Litiges', href: '/dashboard/disputes', icon: ExclamationTriangleIcon },
  { name: 'Statistiques', href: '/dashboard/statistics', icon: ChartBarIcon },
  { name: 'Mon Profil', href: '/dashboard/profile', icon: UserCircleIcon },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Cog6ToothIcon },
  { name: 'Déconnexion', href: '/logout', icon: ArrowLeftOnRectangleIcon }
];

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="h-full bg-gray-900 w-64 fixed left-0 top-0 text-white">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-16 bg-gray-800">
          <h1 className="text-xl font-bold">Twinsk Parcel</h1>
        </div>
        
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-4 py-2 text-sm font-medium rounded-md
                  ${active
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-3 h-6 w-6
                    ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}
                  `}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
