import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline/index.js';
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ClientParcelsModal({ isOpen, onClose, clientId, clientName }) {
  const [parcels, setParcels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && clientId) {
      fetchClientParcels();
    }
  }, [isOpen, clientId]);

  const fetchClientParcels = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('parcels')
        .select(`
          *,
          recipients:recipient_id (
            name,
            phone,
            email
          )
        `)
        .eq('recipient_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setParcels(data || []);
    } catch (error) {
      console.error('Error fetching parcels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      recu: 'Reçu',
      en_preparation: 'En préparation',
      en_transit: 'En transit',
      livre: 'Livré',
      annule: 'Annulé'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      recu: 'bg-blue-100 text-blue-800',
      en_preparation: 'bg-yellow-100 text-yellow-800',
      en_transit: 'bg-purple-100 text-purple-800',
      livre: 'bg-green-100 text-green-800',
      annule: 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-4xl rounded-xl bg-white p-6 w-full">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-xl font-semibold">
                Historique des colis - {clientName}
              </Dialog.Title>
              <button
                onClick={onClose}
                className="rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : parcels.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Aucun colis trouvé pour ce client
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        N° de suivi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Destination
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type d'envoi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Poids
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Volume
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date de création
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parcels.map((parcel) => (
                      <tr key={parcel.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {parcel.tracking_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {parcel.destination_country}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {parcel.shipping_type === 'standard' ? 'Standard' :
                           parcel.shipping_type === 'express' ? 'Express' : 'Maritime'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {parcel.weight ? `${parcel.weight} kg` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {parcel.cbm ? `${parcel.cbm} m³` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(parcel.status)}`}>
                            {getStatusLabel(parcel.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(parcel.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
