import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@utils/dateUtils';
import { formatCurrency } from '@utils/currencyUtils';
import ParcelPhotos from './ParcelPhotos';

const COUNTRIES = {
  france: { name: 'France', flag: '🇫🇷', currency: 'EUR' },
  gabon: { name: 'Gabon', flag: '🇬🇦', currency: 'XAF' },
  togo: { name: 'Togo', flag: '🇹🇬', currency: 'XOF' },
  cote_ivoire: { name: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF' },
  dubai: { name: 'Dubaï', flag: '🇦🇪', currency: 'AED' }
};

export default function ParcelDetailsDrawer({ open, onClose, parcel, onStatusChange }) {
  if (!parcel) return null;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <h2 className="text-base font-semibold leading-6 text-gray-900">
                          Détails du colis
                        </h2>
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
                    
                    <div className="flex-1 px-4 py-6 sm:px-6">
                      {/* Photos du colis */}
                      <div className="mb-8">
                        <h3 className="text-sm font-medium text-gray-500 mb-4">Photos</h3>
                        <ParcelPhotos parcelId={parcel.id} />
                      </div>

                      {/* Informations du colis */}
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">N° de suivi</dt>
                          <dd className="mt-1 text-sm text-gray-900">{parcel.tracking_number}</dd>
                        </div>

                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Destinataire</dt>
                          <dd className="mt-1 text-sm text-gray-900">{parcel.recipient_name}</dd>
                        </div>

                        <div>
                          <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                          <dd className="mt-1 text-sm text-gray-900">{parcel.recipient_phone}</dd>
                        </div>

                        {parcel.recipient_email && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                            <dd className="mt-1 text-sm text-gray-900">{parcel.recipient_email}</dd>
                          </div>
                        )}

                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Adresse</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {parcel.destination_address}
                            {parcel.destination_postal_code && `, ${parcel.destination_postal_code}`}
                            {parcel.destination_city && `, ${parcel.destination_city}`}
                            <br />
                            {COUNTRIES[parcel.destination_country]?.flag} {COUNTRIES[parcel.destination_country]?.name}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-sm font-medium text-gray-500">Poids</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {parcel.weight ? `${parcel.weight} kg` : '-'}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-sm font-medium text-gray-500">Dimensions</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {parcel.dimensions || '-'}
                          </dd>
                        </div>

                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Description</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {parcel.description || '-'}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-sm font-medium text-gray-500">Prix total</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {formatCurrency(parcel.total_price, parcel.currency)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-sm font-medium text-gray-500">Frais d'envoi</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {formatCurrency(parcel.shipping_cost, parcel.currency)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-sm font-medium text-gray-500">Date de création</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {formatDate(parcel.created_at)}
                          </dd>
                        </div>

                        {parcel.sent_date && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Date d'envoi</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {formatDate(parcel.sent_date)}
                            </dd>
                          </div>
                        )}

                        {parcel.estimated_delivery_date && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Livraison estimée</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {formatDate(parcel.estimated_delivery_date)}
                            </dd>
                          </div>
                        )}

                        {parcel.delivered_date && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Date de livraison</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {formatDate(parcel.delivered_date)}
                            </dd>
                          </div>
                        )}
                      </dl>
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
