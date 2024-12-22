import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { toast } from 'react-hot-toast';
import { Tab } from '@headlessui/react';
import { useTheme } from '../../context/ThemeContext';
import { translations } from '../../locales/translations';
import { CogIcon, TruckIcon, GlobeAltIcon, UserIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import RolesMatrix from '@components/settings/RolesMatrix';
import EmployeeManagement from '@components/settings/EmployeeManagement';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const formatPrice = (price, currency_symbol) => {
  return `${price.toLocaleString()} ${currency_symbol}`;
};

const getShippingTypeLabel = (type) => {
  switch (type) {
    case 'standard':
      return 'Standard';
    case 'express':
      return 'Express';
    case 'maritime':
      return 'Maritime';
    default:
      return type;
  }
};

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme, language, changeLanguage } = useTheme();
  const t = translations[language];

  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState([]);
  const [rates, setRates] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [editingRate, setEditingRate] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    fetchCountriesAndRates();
  }, []);

  const fetchCountriesAndRates = async () => {
    try {
      const { data: countriesData, error: countriesError } = await supabase
        .from('destination_countries')
        .select('*')
        .order('country_name');

      if (countriesError) throw countriesError;

      const { data: ratesData, error: ratesError } = await supabase
        .from('shipping_rates')
        .select(`
          *,
          destination_countries (
            country_name,
            country_code,
            currency_symbol
          )
        `)
        .order('country_id');

      if (ratesError) throw ratesError;

      setCountries(countriesData);
      setRates(ratesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleRateUpdate = async (rate) => {
    try {
      const { error } = await supabase
        .from('shipping_rates')
        .update({
          price_per_kg: rate.price_per_kg,
          price_per_cbm: rate.price_per_cbm,
          estimated_days: rate.estimated_days,
          updated_at: new Date().toISOString()
        })
        .eq('id', rate.id);

      if (error) throw error;
      
      toast.success('Tarif mis à jour avec succès');
      fetchCountriesAndRates();
      setEditingRate(null);
    } catch (error) {
      console.error('Error updating rate:', error);
      toast.error('Erreur lors de la mise à jour du tarif');
    }
  };

  const tabs = [
    { name: t.settings.general, icon: CogIcon },
    { name: 'Employés', icon: UserIcon },
    { name: 'Tarification', icon: TruckIcon },
    { name: 'Pays', icon: GlobeAltIcon },
    { name: 'Profil', icon: UserIcon },
    { name: 'Rôles & Permissions', icon: null }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <div className="max-w-7xl mx-auto">
          <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
            <div className="flex flex-col lg:flex-row">
              {/* Sidebar */}
              <div className="w-full lg:w-64 lg:pr-8 mb-6 lg:mb-0">
                <Tab.List className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible space-x-2 lg:space-x-0 lg:space-y-1 p-2 lg:p-0 bg-gray-50 lg:bg-transparent rounded-lg lg:rounded-none">
                  {tabs.map((tab) => (
                    <Tab
                      key={tab.name}
                      className={({ selected }) =>
                        classNames(
                          'flex items-center px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap',
                          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                          selected
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        )
                      }
                    >
                      {tab.icon && <tab.icon className="mr-3 h-5 w-5 flex-shrink-0" />}
                      {tab.name}
                    </Tab>
                  ))}
                </Tab.List>
              </div>

              {/* Main content */}
              <div className="flex-1">
                <Tab.Panels>
                  {/* Général */}
                  <Tab.Panel>
                    <div className="bg-white shadow sm:rounded-lg">
                      <div className="px-4 py-5 sm:p-6 space-y-6">
                        <div>
                          <h3 className="text-lg font-medium leading-6 text-gray-900">
                            {t.settings.appearance}
                          </h3>
                          <div className="mt-6 space-y-6">
                            {/* Thème */}
                            <div className="flex items-center justify-between">
                              <span className="flex-grow flex flex-col">
                                <span className="text-sm font-medium text-gray-900">
                                  {t.settings.theme.title}
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={toggleTheme}
                                className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                role="switch"
                                aria-checked={theme === 'dark'}
                              >
                                <span className="sr-only">Use dark theme</span>
                                <div
                                  className={classNames(
                                    theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200',
                                    'relative inline-flex h-5 w-10 rounded-full transition-colors ease-in-out duration-200'
                                  )}
                                >
                                  <span
                                    className={classNames(
                                      theme === 'dark' ? 'translate-x-5' : 'translate-x-0',
                                      'inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200'
                                    )}
                                  >
                                    {theme === 'dark' ? (
                                      <MoonIcon className="h-4 w-4 text-indigo-600" />
                                    ) : (
                                      <SunIcon className="h-4 w-4 text-yellow-500" />
                                    )}
                                  </span>
                                </div>
                              </button>
                            </div>

                            {/* Langue */}
                            <div>
                              <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                                {t.settings.language.title}
                              </label>
                              <select
                                id="language"
                                name="language"
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                value={language}
                                onChange={(e) => changeLanguage(e.target.value)}
                              >
                                <option value="fr">Français</option>
                                <option value="en">English</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>

                  {/* Employés */}
                  <Tab.Panel>
                    <div className="bg-white shadow sm:rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <EmployeeManagement />
                      </div>
                    </div>
                  </Tab.Panel>

                  {/* Tarification */}
                  <Tab.Panel>
                    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="space-y-6">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Pays
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Prix/kg
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Prix/m³
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Délai (jours)
                                  </th>
                                  <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {rates.map((rate) => (
                                  <tr key={rate.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {rate.destination_countries.country_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {getShippingTypeLabel(rate.shipping_type)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {formatPrice(rate.price_per_kg, rate.destination_countries.currency_symbol)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {formatPrice(rate.price_per_cbm, rate.destination_countries.currency_symbol)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {rate.estimated_days}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      <button
                                        onClick={() => setEditingRate(rate)}
                                        className="text-indigo-600 hover:text-indigo-900"
                                      >
                                        Modifier
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>

                  {/* Pays */}
                  <Tab.Panel>
                    <div className="bg-white shadow sm:rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {countries.map((country) => (
                              <div
                                key={country.id}
                                className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                <h3 className="text-lg font-medium text-gray-900">
                                  {country.country_name}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                  Code: {country.country_code}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Devise: {country.currency_symbol}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>

                  {/* Profil */}
                  <Tab.Panel>
                    <div className="bg-white shadow sm:rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                          Informations du profil
                        </h3>
                        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                          <div className="sm:col-span-3">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                              Email
                            </label>
                            <div className="mt-1">
                              <input
                                type="email"
                                name="email"
                                id="email"
                                disabled
                                value={user?.email || ''}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>

                  {/* Rôles & Permissions */}
                  <Tab.Panel>
                    <div className="bg-white shadow sm:rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <RolesMatrix />
                      </div>
                    </div>
                  </Tab.Panel>
                </Tab.Panels>
              </div>
            </div>
          </Tab.Group>
        </div>
      </div>
    </div>
  );
}
