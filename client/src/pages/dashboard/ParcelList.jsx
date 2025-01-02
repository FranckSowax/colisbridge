import { Fragment, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { 
  EllipsisVerticalIcon,
  EyeIcon,
  DocumentTextIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { useParcels } from '../../hooks/useParcels';
import ParcelDetails from './ParcelDetails';
import SearchBar from '../../components/SearchBar';
import { toast } from 'react-hot-toast';
import { supabase } from '../../config/supabaseClient';
import EditParcelForm from './EditParcelForm';
import InvoiceModal from '../../components/InvoiceModal';

const parcelStatuses = {
  recu: { name: 'Reçu', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  expedie: { name: 'Expédié', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  receptionne: { name: 'Réceptionné', color: 'bg-green-100 text-green-800 border-green-200' },
  litige: { name: 'Litige', color: 'bg-red-100 text-red-800 border-red-200' },
  termine: { name: 'Terminé', color: 'bg-gray-100 text-gray-800 border-gray-200' }
};

// Mapping des codes pays vers les drapeaux emoji
const countryFlags = {
  'France': '🇫🇷',
  'Gabon': '🇬🇦',
  'Togo': '🇹🇬',
  // Ajoutez d'autres pays selon vos besoins
};

export default function ParcelList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [localParcels, setLocalParcels] = useState([]);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const { 
    parcels, 
    isLoading, 
    error,
    deleteParcel,
    searchQuery,
    handleSearch,
    updateStatus
  } = useParcels(user?.id);

  useEffect(() => {
    if (parcels && JSON.stringify(localParcels) !== JSON.stringify(parcels)) {
      setLocalParcels(parcels);
    }
  }, [parcels]);

  const handleStatusChange = async (parcelId, newStatus) => {
    try {
      // Mise à jour optimiste
      setLocalParcels(prevParcels =>
        prevParcels.map(p =>
          p.id === parcelId ? { ...p, status: newStatus } : p
        )
      );

      let updateData = { status: newStatus };

      // Mettre à jour les dates selon le statut
      if (newStatus === 'expedie') {
        updateData.shipping_date = new Date().toISOString();
      } else if (newStatus === 'receptionne') {
        updateData.reception_date = new Date().toISOString();
      }

      // Utiliser la mutation updateStatus
      await updateStatus({ parcelId, newStatus, updateData });

      const statusMessages = {
        expedie: 'Colis marqué comme expédié',
        receptionne: 'Colis réceptionné dans l\'agence locale',
        termine: 'Colis marqué comme terminé',
        litige: 'Litige créé et statut mis à jour'
      };

      toast.success(statusMessages[newStatus] || 'Statut mis à jour avec succès');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors de la mise à jour du statut');
      
      // Restaurer l'état en rechargeant les données
      if (parcels) {
        setLocalParcels(parcels);
      }
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Liste des colis</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste de tous vos colis
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Rechercher par numéro de suivi, destinataire, téléphone ou adresse"
            className="mb-4"
          />
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                    Date
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Numéro de suivi
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Destinataire
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Pays
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Type d'envoi
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Poids / CBM
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Statut
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Prix Total
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {localParcels.map((parcel) => (
                  <tr key={parcel.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-0">
                      {format(new Date(parcel.created_at), 'dd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                      {parcel.tracking_number}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      <div className="font-medium">{parcel.recipient_name}</div>
                      <div className="text-gray-400">{parcel.recipient?.phone || parcel.recipient?.phone_number || '-'}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="mr-2">{countryFlags[parcel.destination_country] || '🌍'}</span>
                      {parcel.destination_country}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {parcel.shipping_type === 'standard' ? 'Standard' :
                       parcel.shipping_type === 'express' ? 'Express' :
                       parcel.shipping_type === 'maritime' ? 'Maritime' : parcel.shipping_type}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {parcel.weight > 0 ? `${parcel.weight} kg` : ''}
                      {parcel.volume_cbm > 0 ? `${parcel.volume_cbm} m³` : ''}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <select
                        value={parcel.status}
                        onChange={(e) => handleStatusChange(parcel.id, e.target.value)}
                        className={`rounded-md border px-2 py-1 text-sm ${parcelStatuses[parcel.status]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}
                      >
                        <option value="recu">Reçu</option>
                        <option value="expedie">Expédié</option>
                        <option value="receptionne">Réceptionné</option>
                        <option value="litige">Litige</option>
                        <option value="termine">Terminé</option>
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {parcel.total_price ? `${parcel.total_price} ${parcel.currency}` : '-'}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button className="flex items-center text-gray-400 hover:text-gray-600">
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
                          <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="py-1">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => {
                                      setSelectedParcel(parcel);
                                      setShowDetails(true);
                                    }}
                                    className={`${
                                      active ? 'bg-gray-100' : ''
                                    } flex w-full px-4 py-2 text-sm text-gray-700`}
                                  >
                                    <EyeIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                                    Voir les détails
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => {
                                      setSelectedParcel(parcel);
                                      setShowInvoice(true);
                                    }}
                                    className={`${
                                      active ? 'bg-gray-100' : ''
                                    } flex w-full px-4 py-2 text-sm text-gray-700`}
                                  >
                                    <DocumentTextIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                                    Voir la facture
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => {
                                      setSelectedParcel(parcel);
                                      setShowEditForm(true);
                                    }}
                                    className={`${
                                      active ? 'bg-gray-100' : ''
                                    } flex w-full px-4 py-2 text-sm text-gray-700`}
                                  >
                                    <PencilIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                                    Modifier
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => deleteParcel(parcel.id)}
                                    className={`${
                                      active ? 'bg-red-50 text-red-900' : 'text-red-600'
                                    } block px-4 py-2 text-sm w-full text-left`}
                                  >
                                    Supprimer
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
        </div>
      </div>

      <ParcelDetails
        open={showDetails}
        setOpen={setShowDetails}
        parcel={selectedParcel}
      />

      <EditParcelForm
        open={showEditForm}
        setOpen={setShowEditForm}
        parcel={selectedParcel}
        onUpdate={updateStatus}
      />

      <InvoiceModal 
        open={showInvoice} 
        setOpen={setShowInvoice} 
        invoiceData={selectedParcel} 
      />
    </div>
  );
}
