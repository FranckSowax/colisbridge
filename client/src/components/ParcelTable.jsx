import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../config/supabaseClient';
import ParcelDetailsPopup from './ParcelDetailsPopup';
import ParcelCard from './ParcelCard';

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
};

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function ParcelTable({ parcels, onStatusChange }) {
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd MMM yyyy', { locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return '-';
    }
  };

  const handleStatusChange = async (parcelId, newStatus) => {
    try {
      const updates = {
        status: newStatus,
        ...(newStatus === 'expedie' ? { shipping_date: new Date().toISOString() } : {})
      };

      const { error } = await supabase
        .from('parcels')
        .update(updates)
        .eq('id', parcelId);

      if (error) throw error;

      if (onStatusChange) {
        onStatusChange(parcelId, newStatus);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleViewDetails = (parcel) => {
    setSelectedParcel(parcel);
    setIsModalOpen(true);
  };

  // Vue mobile avec des cartes
  const MobileView = () => (
    <div className="space-y-4 px-4">
      {parcels.map((parcel) => (
        <ParcelCard
          key={parcel.id}
          parcel={parcel}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );

  // Vue desktop avec table
  const DesktopView = () => (
    <div className="flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Date de création
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Numéro de suivi
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Destinataire
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Destination
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Type d'envoi
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Poids (kg)
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Date d'envoi
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Statut
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {parcels.map((parcel) => (
                <tr key={parcel.id}>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDate(parcel.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                    {parcel.tracking_number}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {parcel.recipient_name}
                      </span>
                      {parcel.recipient?.phone && (
                        <span className="text-xs text-gray-500">
                          {parcel.recipient.phone}
                        </span>
                      )}
                    </div>
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
                    {parcel.shipping_type || 'Standard'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {parcel.weight}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDate(parcel.shipping_date)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <select
                      value={parcel.status}
                      onChange={(e) => handleStatusChange(parcel.id, e.target.value)}
                      className={classNames(
                        'rounded-md px-2.5 py-1.5 text-xs font-medium ring-1 ring-inset w-32',
                        statuses[parcel.status]?.color || 'bg-gray-50 text-gray-700 ring-gray-600/20'
                      )}
                    >
                      {Object.entries(statuses).map(([value, { label }]) => (
                        <option 
                          key={value} 
                          value={value}
                          className="bg-white text-gray-900"
                        >
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      onClick={() => handleViewDetails(parcel)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Voir les détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Vue mobile (sm et en dessous) */}
      <div className="sm:hidden">
        <MobileView />
      </div>

      {/* Vue desktop (sm et au-dessus) */}
      <div className="hidden sm:block">
        <DesktopView />
      </div>

      {/* Modal de détails */}
      {selectedParcel && (
        <ParcelDetailsPopup
          isOpen={isModalOpen}
          parcel={selectedParcel}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
