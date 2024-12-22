import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@utils/dateUtils';

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
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto relative w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-lg font-medium text-gray-900">
                          Détails du colis
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                            onClick={onClose}
                          >
                            <span className="sr-only">Fermer</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative flex-1 px-4 py-6 sm:px-6">
                      {/* Contenu des détails */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Numéro de suivi</h3>
                          <p className="mt-1 text-sm text-gray-900">{parcel.tracking_number}</p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Destinataire</h3>
                          <p className="mt-1 text-sm text-gray-900">{parcel.recipient?.name}</p>
                          <p className="mt-1 text-sm text-gray-500">{parcel.recipient?.phone}</p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Statut</h3>
                          <p className="mt-1 text-sm text-gray-900">{parcel.status}</p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Destination</h3>
                          <p className="mt-1 text-sm text-gray-900">{parcel.destination_country}</p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Type d'envoi</h3>
                          <p className="mt-1 text-sm text-gray-900">{parcel.shipping_type}</p>
                        </div>

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

                        {parcel.special_instructions && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Instructions spéciales</h3>
                            <p className="mt-1 text-sm text-gray-900">{parcel.special_instructions}</p>
                          </div>
                        )}

                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Date de création</h3>
                          <p className="mt-1 text-sm text-gray-900">{formatDate(parcel.created_at)}</p>
                        </div>

                        {parcel.photo_urls && parcel.photo_urls.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Photos</h3>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {parcel.photo_urls.map((url, index) => (
                                <img
                                  key={index}
                                  src={url}
                                  alt={`Photo ${index + 1}`}
                                  className="h-32 w-full object-cover rounded-lg"
                                />
                              ))}
                            </div>
                          </div>
                        )}
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
