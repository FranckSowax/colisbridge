import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Menu, Transition } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { classNames } from '../utils/classNames';
import { toast } from 'react-hot-toast';
import { useUpdateParcelStatus } from '../hooks/useUpdateParcelStatus';
import InvoiceModal from './InvoiceModal';
import ParcelDetailsPopup from './ParcelDetailsPopup';
import ParcelCard from './ParcelCard';
import { useLanguage } from '../context/LanguageContext';

const statusStyles = {
  reçu: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
  expédié: 'bg-blue-50 text-blue-800 ring-blue-600/20',
  terminé: 'bg-green-50 text-green-800 ring-green-600/20',
  receptionne: 'bg-green-50 text-green-800 ring-green-600/20',
  litige: 'bg-red-50 text-red-800 ring-red-600/20',
};

const statusOrder = {
  'reçu': 0,
  'expédié': 1,
  'terminé': 2,
  'receptionne': 3,
  'litige': 4
};

const destinations = {
  france: { name: 'FRANCE', flag: '🇫🇷' },
  gabon: { name: 'GABON', flag: '🇬🇦' },
  togo: { name: 'TOGO', flag: '🇹🇬' },
  cote_ivoire: { name: "CÔTE D'IVOIRE", flag: '🇨🇮' },
  dubai: { name: 'DUBAÏ', flag: '🇦🇪' },
};

const statuses = {
  recu: { label: 'Reçu', color: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20' },
  expedie: { label: 'Expédié', color: 'bg-blue-100 text-blue-800 ring-blue-600/20' },
  receptionne: { label: 'Réceptionné', color: 'bg-green-100 text-green-800 ring-green-600/20' },
  termine: { label: 'Terminé', color: 'bg-purple-100 text-purple-800 ring-purple-600/20' },
  litige: { label: 'Litige', color: 'bg-red-100 text-red-800 ring-red-600/20' },
};

export default function ParcelTable({ parcels, onStatusChange }) {
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const updateParcelStatus = useUpdateParcelStatus();
  const { t } = useLanguage();

  const columns = [
    { key: 'tracking_number', label: t('parcels.tracking') },
    { key: 'recipient_name', label: t('parcels.recipient') },
    { key: 'reception_date', label: t('parcels.date') },
    { key: 'shipping_type', label: t('parcels.type') },
    { key: 'status', label: t('parcels.status') },
    { key: 'actions', label: t('parcels.actions') },
  ];

  const statusLabels = {
    received: t('parcels.status.received'),
    shipped: t('parcels.status.shipped'),
    delivered: t('parcels.status.delivered'),
    completed: t('parcels.status.completed'),
  };

  const handleStatusChange = async (parcelId, newStatus) => {
    try {
      await updateParcelStatus.mutateAsync({ id: parcelId, status: newStatus });
      toast.success('Statut mis à jour avec succès');
      if (onStatusChange) {
        onStatusChange(parcelId, newStatus);
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const getNextStatus = (currentStatus) => {
    const statuses = ['reçu', 'expédié', 'receptionne', 'terminé', 'litige'];
    const currentIndex = statuses.indexOf(currentStatus);
    return currentIndex < statuses.length - 1 ? statuses[currentIndex + 1] : null;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd MMM yyyy', { locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return '-';
    }
  };

  return (
    <div>
      {/* Version desktop */}
      <div className="hidden sm:block">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {parcels.map((parcel) => (
              <tr key={parcel.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                  {parcel.tracking_number}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {parcel.recipient?.full_name}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {formatDate(parcel.created_at)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {parcel.shipping_type}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {parcel.country ? (
                    <div className="flex items-center space-x-1">
                      <span>{destinations[parcel.country]?.flag || '🌍'}</span>
                      <span>{destinations[parcel.country]?.name || parcel.country.toUpperCase()}</span>
                    </div>
                  ) : '-'}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <span className={classNames(
                    statusStyles[parcel.status],
                    'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset'
                  )}>
                    {parcel.status}
                  </span>
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                  <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button className="inline-flex items-center rounded-full p-1.5 text-gray-500 hover:text-gray-600">
                      <span className="sr-only">Open options</span>
                      <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                    </Menu.Button>
                    <Transition
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => {
                                  setSelectedParcel(parcel);
                                  setIsInvoiceModalOpen(true);
                                }}
                                className={classNames(
                                  active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                  'block w-full px-4 py-2 text-left text-sm'
                                )}
                              >
                                {t('parcels.viewInvoice')}
                              </button>
                            )}
                          </Menu.Item>
                          {getNextStatus(parcel.status) && (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleStatusChange(parcel.id, getNextStatus(parcel.status))}
                                  className={classNames(
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                    'block w-full px-4 py-2 text-left text-sm'
                                  )}
                                >
                                  {t('parcels.status.update')} {getNextStatus(parcel.status)}
                                </button>
                              )}
                            </Menu.Item>
                          )}
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => {
                                  setSelectedParcel(parcel);
                                  setIsModalOpen(true);
                                }}
                                className={classNames(
                                  active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                  'block w-full px-4 py-2 text-left text-sm'
                                )}
                              >
                                {t('parcels.viewDetails')}
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Version mobile */}
      <div className="sm:hidden space-y-4">
        {parcels.map((parcel) => (
          <ParcelCard
            key={parcel.id}
            parcel={parcel}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      <InvoiceModal
        open={isInvoiceModalOpen}
        setOpen={setIsInvoiceModalOpen}
        invoiceData={selectedParcel}
      />

      {selectedParcel && (
        <ParcelDetailsPopup
          isOpen={isModalOpen}
          parcel={selectedParcel}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
