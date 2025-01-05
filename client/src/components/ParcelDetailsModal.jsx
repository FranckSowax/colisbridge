import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { supabase } from '../config/supabaseClient';

export default function ParcelDetailsModal({ isOpen, onClose, parcel }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    const fetchParcelPhotos = async () => {
      if (!parcel?.id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('parcel_photos')
          .select('*')
          .eq('parcel_id', parcel.id);

        if (error) throw error;

        const photosWithUrls = await Promise.all(
          data.map(async (photo) => {
            const { data: { publicUrl }} = supabase
              .storage
              .from('parcel-photos')
              .getPublicUrl(photo.file_path);
            
            return {
              id: photo.id,
              url: publicUrl,
              description: photo.description || 'Photo du colis'
            };
          })
        );

        setPhotos(photosWithUrls);
      } catch (error) {
        console.error('Erreur lors de la récupération des photos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParcelPhotos();
  }, [parcel?.id]);

  if (!parcel) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'recu':
        return 'bg-yellow-100 text-yellow-800';
      case 'expedie':
        return 'bg-blue-100 text-blue-800';
      case 'receptionne':
        return 'bg-green-100 text-green-800';
      case 'termine':
        return 'bg-gray-100 text-gray-800';
      case 'litige':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fermer</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 mb-6">
                      Détails du colis
                    </Dialog.Title>

                    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                      <div className="border-t border-gray-200">
                        <dl>
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Numéro de suivi</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                              {parcel.tracking_number}
                            </dd>
                          </div>
                          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Date de création</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                              {format(new Date(parcel.created_at), 'dd MMMM yyyy', { locale: fr })}
                            </dd>
                          </div>
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Date d'envoi</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                              {parcel.shipped_at ? format(new Date(parcel.shipped_at), 'dd MMMM yyyy', { locale: fr }) : '-'}
                            </dd>
                          </div>
                          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Destinataire</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                              {parcel.recipient_name}
                            </dd>
                          </div>
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Pays</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                              {parcel.country}
                            </dd>
                          </div>
                          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Type d'envoi</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                              {parcel.shipping_type}
                            </dd>
                          </div>
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Poids</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                              {parcel.weight} kg
                            </dd>
                          </div>
                          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Prix Total</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: parcel.currency || 'XAF'
                              }).format(parcel.total_price)}
                            </dd>
                          </div>
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Statut</dt>
                            <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                              <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(parcel.status)}`}>
                                {parcel.status}
                              </span>
                            </dd>
                          </div>
                          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Photos</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                              {loading ? (
                                <div className="text-center py-4">
                                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                                  <p className="mt-2 text-sm text-gray-500">Chargement des photos...</p>
                                </div>
                              ) : photos.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                  {photos.map((photo) => (
                                    <div
                                      key={photo.id}
                                      className="group relative aspect-square cursor-pointer"
                                      onClick={() => setSelectedPhoto(photo)}
                                    >
                                      <img
                                        src={photo.url}
                                        alt={photo.description}
                                        className="h-full w-full rounded-lg object-cover"
                                      />
                                      <div className="absolute inset-0 rounded-lg ring-2 ring-indigo-600 ring-offset-2 ring-opacity-0 group-hover:ring-opacity-100" />
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                                  <p className="mt-2 text-sm text-gray-500">Aucune photo disponible</p>
                                </div>
                              )}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>

        {/* Modal pour afficher la photo en grand */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setSelectedPhoto(null)}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.description}
                  className="w-full rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </Transition.Root>
  );
}
