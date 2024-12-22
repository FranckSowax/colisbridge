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
            <div className="flex">
              {/* Sidebar */}
              <div className="w-64 pr-8">
                <Tab.List className="flex flex-col space-y-1">
                  {tabs.map((tab) => (
                    <Tab
                      key={tab.name}
                      className={({ selected }) =>
                        classNames(
                          'flex items-center px-3 py-2 text-sm font-medium rounded-md',
                          selected
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        )
                      }
                    >
                      {tab.icon && <tab.icon className="mr-3 h-5 w-5" />}
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
                                <option value="fr">{t.settings.language.french}</option>
                                <option value="zh">{t.settings.language.chinese}</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>

                  {/* Employés */}
                  <Tab.Panel>
                    <EmployeeManagement />
                  </Tab.Panel>

                  {/* Tarification */}
                  <Tab.Panel>
                    <div className="bg-white shadow sm:rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                          Tarification par pays
                        </h3>
                        <div className="mt-6">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Pays
                                </th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Type
                                </th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Prix/kg
                                </th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Prix/m³
                                </th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Délai estimé
                                </th>
                                <th className="px-6 py-3 bg-gray-50"></th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {rates.map((rate) => (
                                <tr key={rate.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {rate.destination_countries.country_name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {getShippingTypeLabel(rate.shipping_type)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {editingRate?.id === rate.id ? (
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="number"
                                          className="w-24 rounded-md border-gray-300"
                                          value={editingRate.price_per_kg}
                                          onChange={(e) =>
                                            setEditingRate({
                                              ...editingRate,
                                              price_per_kg: parseFloat(e.target.value)
                                            })
                                          }
                                        />
                                        <span className="text-gray-500">
                                          {rate.destination_countries.currency_symbol}
                                        </span>
                                      </div>
                                    ) : (
                                      formatPrice(
                                        rate.price_per_kg,
                                        rate.destination_countries.currency_symbol
                                      )
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {editingRate?.id === rate.id ? (
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="number"
                                          className="w-24 rounded-md border-gray-300"
                                          value={editingRate.price_per_cbm}
                                          onChange={(e) =>
                                            setEditingRate({
                                              ...editingRate,
                                              price_per_cbm: parseFloat(e.target.value)
                                            })
                                          }
                                        />
                                        <span className="text-gray-500">
                                          {rate.destination_countries.currency_symbol}
                                        </span>
                                      </div>
                                    ) : (
                                      formatPrice(
                                        rate.price_per_cbm,
                                        rate.destination_countries.currency_symbol
                                      )
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {editingRate?.id === rate.id ? (
                                      <input
                                        type="text"
                                        className="w-32 rounded-md border-gray-300"
                                        value={editingRate.estimated_days}
                                        onChange={(e) =>
                                          setEditingRate({
                                            ...editingRate,
                                            estimated_days: e.target.value
                                          })
                                        }
                                      />
                                    ) : (
                                      rate.estimated_days
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {editingRate?.id === rate.id ? (
                                      <div className="space-x-2">
                                        <button
                                          onClick={() => handleRateUpdate(editingRate)}
                                          className="text-indigo-600 hover:text-indigo-900"
                                        >
                                          Enregistrer
                                        </button>
                                        <button
                                          onClick={() => setEditingRate(null)}
                                          className="text-gray-600 hover:text-gray-900"
                                        >
                                          Annuler
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setEditingRate(rate)}
                                        className="text-indigo-600 hover:text-indigo-900"
                                      >
                                        Modifier
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>

                  {/* Pays */}
                  <Tab.Panel>
                    <div className="bg-white shadow sm:rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                          Gestion des pays
                        </h3>
                        {/* Add country management here */}
                      </div>
                    </div>
                  </Tab.Panel>

                  {/* Profil */}
                  <Tab.Panel>
                    <div className="bg-white shadow sm:rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                          Paramètres du profil
                        </h3>
                        {/* Add profile settings here */}
                      </div>
                    </div>
                  </Tab.Panel>

                  {/* Rôles & Permissions */}
                  <Tab.Panel>
                    <RolesMatrix />
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
