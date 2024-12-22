import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@utils/dateUtils';

const statusLabels = {
  recu: 'Reçu',
  expedie: 'Expédié',
  receptionne: 'Réceptionné',
  termine: 'Terminé'
};

const statusColors = {
  recu: 'bg-yellow-100 text-yellow-800',
  expedie: 'bg-blue-100 text-blue-800',
  receptionne: 'bg-green-100 text-green-800',
  termine: 'bg-gray-100 text-gray-800'
};

export default function ParcelDetailsDrawer({ isOpen, onClose, parcel }) {
  if (!parcel) return null;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <Dialog.Title className="text-lg font-medium text-gray-900">
                            Détails du colis
                          </Dialog.Title>
                          <div className="mt-1">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${statusColors[parcel.status]}`}>
                              {statusLabels[parcel.status]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            onClick={onClose}
                          >
                            <span className="sr-only">Fermer</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative flex-1 px-4 py-6 sm:px-6">
                      <div className="space-y-6">
                        <div className="bg-gray-50 px-4 py-5 sm:rounded-lg">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Numéro de suivi</h3>
                              <p className="mt-1 text-sm text-gray-900">{parcel.tracking_number}</p>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Destinataire</h3>
                              <p className="mt-1 text-sm text-gray-900">{parcel.recipient?.name}</p>
                              <p className="mt-1 text-sm text-gray-500">{parcel.recipient?.phone}</p>
                            </div>

                            <div className="flex items-center space-x-2">
                              <div>
                                <h3 className="text-sm font-medium text-gray-500">Destination</h3>
                                <p className="mt-1 text-sm text-gray-900">{parcel.destination_country}</p>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-gray-500">Type d'envoi</h3>
                                <p className="mt-1 text-sm text-gray-900">{parcel.shipping_type}</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {parcel.weight && (
                                <div>
                                  <h3 className="text-sm font-medium text-gray-500">Poids</h3>
                                  <p className="mt-1 text-sm text-gray-900">{parcel.weight} kg</p>
                                </div>
                              )}

                              {parcel.cbm && (
                                <div>
                                  <h3 className="text-sm font-medium text-gray-500">Volume (CBM)</h3>
                                  <p className="mt-1 text-sm text-gray-900">{parcel.cbm} m³</p>
                                </div>
                              )}
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Dates</h3>
                              <div className="mt-1 space-y-1">
                                <p className="text-sm text-gray-900">
                                  Créé le {formatDate(parcel.created_at)}
                                </p>
                                {parcel.shipping_date && (
                                  <p className="text-sm text-gray-900">
                                    Envoyé le {formatDate(parcel.shipping_date)}
                                  </p>
                                )}
                              </div>
                            </div>

                            {parcel.special_instructions && (
                              <div>
                                <h3 className="text-sm font-medium text-gray-500">Instructions spéciales</h3>
                                <p className="mt-1 text-sm text-gray-900">{parcel.special_instructions}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
