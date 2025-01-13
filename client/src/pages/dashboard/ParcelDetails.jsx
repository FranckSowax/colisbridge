import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline/index.js';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../../config/supabaseClient';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { photoService } from '../../services/photoService';

const parcelStatuses = {
  recu: { name: 'Reçu', color: 'bg-yellow-100 text-yellow-800' },
  expedie: { name: 'Expédié', color: 'bg-blue-100 text-blue-800' },
  receptionne: { name: 'Réceptionné', color: 'bg-green-100 text-green-800' },
  litige: { name: 'Litige', color: 'bg-red-100 text-red-800' },
  termine: { name: 'Terminé', color: 'bg-gray-100 text-gray-800' }
};

export default function ParcelDetails({ open, setOpen, parcel }) {
  const [loading, setLoading] = useState(false);

  // Charger les photos avec React Query
  const { data: photos = [], isLoading: photosLoading } = useQuery({
    queryKey: ['parcel-photos', parcel?.id],
    queryFn: () => photoService.getParcelPhotos(parcel.id),
    enabled: !!parcel?.id && open
  });

  if (!parcel) return null;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Fermer</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <Dialog.Title as="h3" className="text-2xl font-semibold leading-6 text-gray-900 mb-6">
                      Détails du colis #{parcel.tracking_number}
                    </Dialog.Title>

                    {/* Section photos */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Photos du colis</h4>
                      {photosLoading ? (
                        <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                      ) : photos.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                          {photos.map((photo) => (
                            <div key={photo.id} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
                              <img
                                src={photo.url}
                                alt={`Photo du colis`}
                                className="h-full w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(photo.url, '_blank')}
                                onError={(e) => {
                                  console.error('Error loading image:', photo.url);
                                  e.target.src = '/placeholder-image.jpg';
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-500">Aucune photo disponible</p>
                        </div>
                      )}
                    </div>

                    {/* Informations du destinataire */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Destinataire</h4>
                      <div className="rounded-lg bg-gray-50 p-4">
                        <p className="text-sm text-gray-900">{parcel.recipient_name}</p>
                        <p className="text-sm text-gray-500">{parcel.recipient_phone}</p>
                        {parcel.recipient_email && (
                          <p className="text-sm text-gray-500">{parcel.recipient_email}</p>
                        )}
                        {parcel.recipient_address && (
                          <p className="text-sm text-gray-500 mt-1">{parcel.recipient_address}</p>
                        )}
                      </div>
                    </div>

                    {/* Autres détails du colis */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Poids</h4>
                        <p className="text-sm text-gray-500">{parcel.weight} kg</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Prix total</h4>
                        <p className="text-sm text-gray-500">{parcel.total_price || '-'} €</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Pays de destination</h4>
                        <p className="text-sm text-gray-500">{parcel.destination_country}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Statut</h4>
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${parcelStatuses[parcel.status]?.color}`}>
                          {parcelStatuses[parcel.status]?.name || parcel.status}
                        </span>
                      </div>
                    </div>

                    {/* Dates importantes */}
                    <div className="rounded-lg bg-gray-50 p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Dates importantes</h4>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-gray-500">Création</p>
                          <p className="text-sm text-gray-900">
                            {format(new Date(parcel.created_at), 'dd MMM yyyy', { locale: fr })}
                          </p>
                        </div>
                        {parcel.shipping_date && (
                          <div>
                            <p className="text-xs text-gray-500">Expédition</p>
                            <p className="text-sm text-gray-900">
                              {format(new Date(parcel.shipping_date), 'dd MMM yyyy', { locale: fr })}
                            </p>
                          </div>
                        )}
                        {parcel.reception_date && (
                          <div>
                            <p className="text-xs text-gray-500">Réception</p>
                            <p className="text-sm text-gray-900">
                              {format(new Date(parcel.reception_date), 'dd MMM yyyy', { locale: fr })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {parcel.notes && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
                        <p className="text-sm text-gray-500 whitespace-pre-wrap">{parcel.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
