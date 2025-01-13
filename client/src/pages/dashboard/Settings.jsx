import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import PricingTable from '../../components/PricingTable';
import RolesMatrix from '../../components/settings/RolesMatrix';
import EmployeeManagement from '../../components/settings/EmployeeManagement';
import { useLanguage } from '../../contexts/LanguageContext';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Settings() {
  const [selectedTab, setSelectedTab] = useState(0);
  const { language, changeLanguage, t } = useLanguage();

  const tabs = [
    { name: 'Tarification', icon: '💰' },
    { name: 'Rôles', icon: '👥' },
    { name: 'Employés', icon: '👤' },
    { name: 'Préférences', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="py-4 sm:py-6">
        {/* En-tête */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Paramètres
          </h1>
        </div>

        <div className="mx-auto max-w-7xl px-2 sm:px-6 md:px-8">
          <div className="py-2 sm:py-4">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              {/* En-tête mobile */}
              <div className="block sm:hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-700">
                  <select
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 text-base"
                    value={selectedTab}
                    onChange={(e) => setSelectedTab(parseInt(e.target.value))}
                  >
                    {tabs.map((tab, idx) => (
                      <option key={tab.name} value={idx} className="py-2">
                        {tab.icon} {tab.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Navigation tablette/desktop */}
              <div className="hidden sm:block">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex space-x-4 px-4" aria-label="Tabs">
                    {tabs.map((tab, idx) => (
                      <button
                        key={tab.name}
                        onClick={() => setSelectedTab(idx)}
                        className={classNames(
                          idx === selectedTab
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
                          'flex items-center space-x-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                        )}
                      >
                        <span className="text-xl">{tab.icon}</span>
                        <span>{tab.name}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-2 sm:p-4 md:p-6">
                {selectedTab === 0 && (
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-x-auto">
                      <PricingTable />
                    </div>
                  </div>
                )}
                {selectedTab === 1 && <RolesMatrix />}
                {selectedTab === 2 && <EmployeeManagement />}
                {selectedTab === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 dark:text-white">
                          Langue
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Choisissez la langue de l'interface
                        </p>
                        <div className="mt-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                            <select
                              value={language}
                              onChange={(e) => changeLanguage(e.target.value)}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-sm sm:text-base border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                            >
                              <option value="fr">Français</option>
                              <option value="en">Anglais</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
