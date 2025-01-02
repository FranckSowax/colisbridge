import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { 
  TruckIcon, 
  CalendarIcon, 
  UserIcon,
  PhoneIcon,
  GlobeAltIcon,
  ScaleIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import ParcelPricing from './ParcelPricing';

const statuses = {
  recu: { label: 'Reçu', color: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20' },
  expedie: { label: 'Expédié', color: 'bg-blue-100 text-blue-800 ring-blue-600/20' },
  receptionne: { label: 'Réceptionné', color: 'bg-green-100 text-green-800 ring-green-600/20' },
  termine: { label: 'Terminé', color: 'bg-purple-100 text-purple-800 ring-purple-600/20' },
  litige: { label: 'Litige', color: 'bg-red-100 text-red-800 ring-red-600/20' },
};

const destinations = {
  france: { name: 'FRANCE', flag: '🇫🇷' },
  gabon: { name: 'GABON', flag: '🇬🇦' },
  togo: { name: 'TOGO', flag: '🇹🇬' },
  cote_ivoire: { name: "CÔTE D'IVOIRE", flag: '🇨🇮' },
  dubai: { name: 'DUBAÏ', flag: '🇦🇪' },
  chine: { name: 'CHINE', flag: '🇨🇳' },
  turquie: { name: 'TURQUIE', flag: '🇹🇷' },
};

const statusStyles = {
  reçu: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
  expédié: 'bg-blue-50 text-blue-800 ring-blue-600/20',
  terminé: 'bg-green-50 text-green-800 ring-green-600/20',
  receptionne: 'bg-green-50 text-green-800 ring-green-600/20',
  litige: 'bg-red-50 text-red-800 ring-red-600/20'
};

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function ParcelCard({ parcel, onStatusChange, onViewDetails, onViewInvoice }) {
  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd MMM yyyy', { locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return '-';
    }
  };

  const handleStatusChange = (newStatus) => {
    if (onStatusChange) {
      onStatusChange(parcel.id, newStatus);
    }
  };

  const getNextStatus = (currentStatus) => {
    const statuses = ['reçu', 'expédié', 'receptionne', 'terminé', 'litige'];
    const currentIndex = statuses.indexOf(currentStatus);
    return currentIndex < statuses.length - 1 ? statuses[currentIndex + 1] : null;
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* En-tête de la carte */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <span className={classNames(
              'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
              statuses[parcel.status]?.color || 'bg-gray-100 text-gray-700 ring-gray-600/20'
            )}>
              {statuses[parcel.status]?.label || parcel.status}
            </span>
          </div>
          <Menu as="div" className="relative">
            <Menu.Button className="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900">
              <span className="sr-only">Options</span>
              <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
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
              <Menu.Items className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                {/* Bouton "Voir les détails" uniquement sur mobile */}
                <div className="lg:hidden">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => onViewDetails(parcel)}
                        className={classNames(
                          active ? 'bg-gray-50' : '',
                          'block px-3 py-1 text-sm leading-6 text-gray-900 w-full text-left'
                        )}
                      >
                        Voir les détails
                      </button>
                    )}
                  </Menu.Item>
                  <div className="border-t border-gray-100 my-1"></div>
                </div>
                
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => onViewInvoice(parcel)}
                      className={classNames(
                        active ? 'bg-gray-50' : '',
                        'block px-3 py-1 text-sm leading-6 text-gray-900 w-full text-left'
                      )}
                    >
                      Voir la facture
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleStatusChange('recu')}
                      className={classNames(
                        active ? 'bg-gray-50' : '',
                        'block px-3 py-1 text-sm leading-6 text-gray-900 w-full text-left'
                      )}
                    >
                      Reçu
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleStatusChange('expedie')}
                      className={classNames(
                        active ? 'bg-gray-50' : '',
                        'block px-3 py-1 text-sm leading-6 text-gray-900 w-full text-left'
                      )}
                    >
                      Expédié
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleStatusChange('receptionne')}
                      className={classNames(
                        active ? 'bg-gray-50' : '',
                        'block px-3 py-1 text-sm leading-6 text-gray-900 w-full text-left'
                      )}
                    >
                      Réceptionné
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleStatusChange('termine')}
                      className={classNames(
                        active ? 'bg-gray-50' : '',
                        'block px-3 py-1 text-sm leading-6 text-gray-900 w-full text-left'
                      )}
                    >
                      Terminé
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {parcel.tracking_number}
        </h3>
      </div>

      {/* Corps de la carte */}
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center text-sm text-gray-500">
          <UserIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{parcel.recipient_name}</span>
        </div>

        {parcel.recipient?.phone && (
          <div className="flex items-center text-sm text-gray-500">
            <PhoneIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span>{parcel.recipient.phone}</span>
          </div>
        )}

        <div className="flex items-center text-sm text-gray-500">
          <GlobeAltIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <div className="flex items-center space-x-1">
            <span>{destinations[parcel.country]?.flag || '🌍'}</span>
            <span>{destinations[parcel.country]?.name || parcel.country?.toUpperCase() || '-'}</span>
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-500">
          <TruckIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span>{parcel.shipping_type || 'Standard'}</span>
        </div>

        {parcel.weight && (
          <div className="flex items-center text-sm text-gray-500">
            <ScaleIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span>{parcel.weight} kg</span>
          </div>
        )}

        {parcel.cbm && (
          <div className="flex items-center text-sm text-gray-500">
            <CubeIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span>{parcel.cbm} m³</span>
          </div>
        )}

        <div className="flex items-center text-sm text-gray-500">
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span>Créé le {formatDate(parcel.created_at)}</span>
        </div>

        {parcel.shipping_date && (
          <div className="flex items-center text-sm text-gray-500">
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span>Envoyé le {formatDate(parcel.shipping_date)}</span>
          </div>
        )}

        {/* Composant de tarification */}
        <ParcelPricing parcel={parcel} />
      </div>

      {/* Bouton "Voir les détails" */}
      <div className="px-4 py-3 bg-gray-50">
        <button
          onClick={() => onViewDetails && onViewDetails(parcel)}
          className="w-full text-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Voir les détails
        </button>
      </div>
    </div>
  );
}
