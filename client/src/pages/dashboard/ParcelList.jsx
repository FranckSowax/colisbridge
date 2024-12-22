import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useParcels } from '../../hooks/useParcels';
import { useNavigate } from 'react-router-dom';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { Menu, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import SearchBar from '../../components/SearchBar';
import ParcelDetails from './ParcelDetails';

const parcelStatuses = {
  recu: { name: 'Reçu', color: 'bg-yellow-100 text-yellow-800' },
  en_preparation: { name: 'En préparation', color: 'bg-blue-100 text-blue-800' },
  en_transit: { name: 'En transit', color: 'bg-purple-100 text-purple-800' },
  livre: { name: 'Livré', color: 'bg-green-100 text-green-800' },
  annule: { name: 'Annulé', color: 'bg-red-100 text-red-800' },
};

export default function ParcelList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    parcels, 
    isLoading, 
    error, 
    updateStatus, 
    deleteParcel,
    searchQuery,
    setSearchQuery
  } = useParcels(user?.id);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd MMM yyyy', { locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return '-';
    }
  };

  const handleStatusUpdate = async (parcelId, newStatus) => {
    try {
      await updateStatus.mutateAsync({ parcelId, status: newStatus });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const handleDelete = async (parcelId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce colis ?')) {
      try {
        await deleteParcel.mutateAsync(parcelId);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleViewDetails = (parcel) => {
    setSelectedParcel(parcel);
    setShowDetails(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Une erreur est survenue</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Liste des colis</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste de tous vos colis avec leurs informations de suivi
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mt-4 mb-6">
        <SearchBar
          placeholder="Rechercher par numéro de suivi, destinataire, téléphone ou adresse..."
          onSearch={handleSearch}
        />
      </div>

      {parcels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">Aucun colis trouvé</p>
        </div>
      ) : (
        <>
          {/* Vue mobile : Cartes */}
          <div className="block lg:hidden space-y-4">
            {parcels.map((parcel) => (
              <div
                key={parcel.id}
                className="bg-white shadow rounded-lg overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        #{parcel.tracking_number}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {parcel.recipient_name}
                      </p>
                    </div>
                    <Menu as="div" className="relative">
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
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleViewDetails(parcel)}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } block px-4 py-2 text-sm w-full text-left`}
                                >
                                  Voir les détails
                                </button>
                              )}
                            </Menu.Item>
                            <div className="border-t border-gray-100" />
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleStatusUpdate(parcel.id, 'recu')}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } block px-4 py-2 text-sm w-full text-left`}
                                >
                                  Marquer comme reçu
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleStatusUpdate(parcel.id, 'en_preparation')}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } block px-4 py-2 text-sm w-full text-left`}
                                >
                                  Marquer en préparation
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleStatusUpdate(parcel.id, 'en_transit')}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } block px-4 py-2 text-sm w-full text-left`}
                                >
                                  Marquer en transit
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleStatusUpdate(parcel.id, 'livre')}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } block px-4 py-2 text-sm w-full text-left`}
                                >
                                  Marquer comme livré
                                </button>
                              )}
                            </Menu.Item>
                            <div className="border-t border-gray-100" />
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleDelete(parcel.id)}
                                  className={`${
                                    active ? 'bg-red-50 text-red-900' : 'text-red-700'
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
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm">
                      <div className="text-gray-500">Pays</div>
                      <div className="font-medium text-gray-900">{parcel.destination_country}</div>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <div className="text-gray-500">Poids</div>
                      <div className="font-medium text-gray-900">{parcel.weight} kg</div>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <div className="text-gray-500">Date</div>
                      <div className="font-medium text-gray-900">{formatDate(parcel.created_at)}</div>
                    </div>
                    <div className="mt-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${parcelStatuses[parcel.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {parcelStatuses[parcel.status]?.name || parcel.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Vue desktop : Tableau */}
          <div className="hidden lg:block">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Numéro de suivi
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Destinataire
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Pays
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Poids
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Statut
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Date
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {parcels.map((parcel) => (
                      <tr key={parcel.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {parcel.tracking_number}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {parcel.recipient_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {parcel.destination_country}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {parcel.weight} kg
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${parcelStatuses[parcel.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                            {parcelStatuses[parcel.status]?.name || parcel.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDate(parcel.created_at)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Menu as="div" className="relative inline-block text-left">
                            <div>
                              <Menu.Button className="flex items-center text-gray-400 hover:text-gray-600">
                                <span className="sr-only">Options</span>
                                <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                              </Menu.Button>
                            </div>
                            <Transition
                              as={Fragment}
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
                                        onClick={() => handleViewDetails(parcel)}
                                        className={`${
                                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                        } block px-4 py-2 text-sm w-full text-left`}
                                      >
                                        Voir les détails
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <div className="border-t border-gray-100" />
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleStatusUpdate(parcel.id, 'recu')}
                                        className={`${
                                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                        } block px-4 py-2 text-sm w-full text-left`}
                                      >
                                        Marquer comme reçu
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleStatusUpdate(parcel.id, 'en_preparation')}
                                        className={`${
                                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                        } block px-4 py-2 text-sm w-full text-left`}
                                      >
                                        Marquer en préparation
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleStatusUpdate(parcel.id, 'en_transit')}
                                        className={`${
                                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                        } block px-4 py-2 text-sm w-full text-left`}
                                      >
                                        Marquer en transit
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleStatusUpdate(parcel.id, 'livre')}
                                        className={`${
                                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                        } block px-4 py-2 text-sm w-full text-left`}
                                      >
                                        Marquer comme livré
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <div className="border-t border-gray-100" />
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleDelete(parcel.id)}
                                        className={`${
                                          active ? 'bg-red-50 text-red-900' : 'text-red-700'
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
        </>
      )}

      {/* Modal des détails du colis */}
      <ParcelDetails
        open={showDetails}
        setOpen={setShowDetails}
        parcel={selectedParcel}
      />
    </div>
  );
}
