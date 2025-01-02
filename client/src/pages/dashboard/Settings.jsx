import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Tab } from '@headlessui/react';
import { useTheme } from '../../context/ThemeContext';
import { translations } from '../../locales/translations';
import { CogIcon, TruckIcon, GlobeAltIcon, UserIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import RolesMatrix from '@components/settings/RolesMatrix';
import EmployeeManagement from '@components/settings/EmployeeManagement';
import PricingTable from '../../components/PricingTable';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme, language, changeLanguage } = useTheme();
  const t = translations[language];
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    {
      name: 'Tarification',
      icon: TruckIcon,
      component: <PricingTable />
    },
    {
      name: 'Rôles',
      icon: UserIcon,
      component: <RolesMatrix />
    },
    {
      name: 'Employés',
      icon: GlobeAltIcon,
      component: <EmployeeManagement />
    },
    {
      name: 'Préférences',
      icon: CogIcon,
      component: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Thème</h3>
            <div className="mt-2">
              <button
                onClick={toggleTheme}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {theme === 'dark' ? (
                  <>
                    <SunIcon className="h-5 w-5 mr-2" />
                    Mode clair
                  </>
                ) : (
                  <>
                    <MoonIcon className="h-5 w-5 mr-2" />
                    Mode sombre
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Langue</h3>
            <div className="mt-2">
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Paramètres</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
            <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
              {tabs.map((tab) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                      'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                      selected
                        ? 'bg-white text-blue-700 shadow'
                        : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                    )
                  }
                >
                  <div className="flex items-center justify-center">
                    <tab.icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </div>
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels className="mt-2">
              {tabs.map((tab, idx) => (
                <Tab.Panel
                  key={idx}
                  className={classNames(
                    'rounded-xl bg-white p-3',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
                  )}
                >
                  {tab.component}
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </div>
  );
}
