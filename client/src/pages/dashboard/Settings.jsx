import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import PricingTable from '../../components/PricingTable';
import RolesMatrix from '../../components/settings/RolesMatrix';
import EmployeeManagement from '../../components/settings/EmployeeManagement';
import { useLanguage } from '../../context/LanguageContext';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Settings() {
  const [selectedTab, setSelectedTab] = useState(0);
  const { language, changeLanguage, t } = useLanguage();

  const tabs = [
    { name: t('settings.pricing'), icon: '💰' },
    { name: t('settings.roles'), icon: '👥' },
    { name: t('settings.employees'), icon: '👤' },
    { name: t('settings.preferences'), icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* En-tête mobile */}
          <div className="sm:hidden">
            <select
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedTab}
              onChange={(e) => setSelectedTab(parseInt(e.target.value))}
            >
              {tabs.map((tab, idx) => (
                <option key={tab.name} value={idx}>
                  {tab.icon} {tab.name}
                </option>
              ))}
            </select>
          </div>

          {/* Navigation tablette/desktop */}
          <div className="hidden sm:block border-b border-gray-200">
            <div className="flex space-x-4 p-4">
              {tabs.map((tab, idx) => (
                <button
                  key={tab.name}
                  className={classNames(
                    idx === selectedTab
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                    'flex items-center space-x-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                  )}
                  onClick={() => setSelectedTab(idx)}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contenu */}
          <div className="p-2 sm:p-4 md:p-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {t('settings.title')}
                  </h1>
                  <p className="mt-2 text-sm text-gray-700">
                    {t('settings.description')}
                  </p>
                </div>
              </div>
            </div>
            {selectedTab === 0 && (
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-medium text-gray-900">
                  {t('settings.pricing')}
                </h2>
                <div className="bg-white rounded-lg overflow-hidden">
                  <PricingTable />
                </div>
              </div>
            )}
            {selectedTab === 1 && <RolesMatrix />}
            {selectedTab === 2 && <EmployeeManagement />}
            {selectedTab === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-medium text-gray-900">
                  {t('settings.preferences')}
                </h2>
                <p className="text-gray-500">
                  Configuration des préférences à venir...
                </p>
                <div className="mt-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-medium leading-6 text-gray-900">{t('settings.language')}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Choisissez la langue de l'interface
                    </p>
                    <div className="mt-4 space-y-4">
                      <div className="flex flex-col gap-4 sm:flex-row">
                        {['fr', 'en', 'zh'].map((lang) => (
                          <button
                            key={lang}
                            onClick={() => changeLanguage(lang)}
                            className={classNames(
                              'flex items-center justify-center px-4 py-2 border rounded-md',
                              language === lang
                                ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            )}
                          >
                            <span className="text-sm font-medium">
                              {t(`settings.languages.${lang}`)}
                            </span>
                          </button>
                        ))}
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
  );
}
