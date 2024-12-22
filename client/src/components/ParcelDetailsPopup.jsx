import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const formatDate = (date) => {
  if (!date) return '-'
  try {
    return format(new Date(date), 'dd MMMM yyyy', { locale: fr })
  } catch (error) {
    return '-'
  }
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price || 0)
}

const statuses = {
  recu: { label: 'Reçu', color: 'bg-yellow-50 text-yellow-700' },
  expedie: { label: 'Expédié', color: 'bg-blue-50 text-blue-700' },
  receptionne: { label: 'Réceptionné', color: 'bg-green-50 text-green-700' },
  termine: { label: 'Terminé', color: 'bg-purple-50 text-purple-700' },
  litige: { label: 'Litige', color: 'bg-red-50 text-red-700' },
}

export default function ParcelDetailsPopup({ parcel, open, setOpen }) {
  if (!parcel) return null

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
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
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                      Détails du colis #{parcel.tracking_number}
                    </Dialog.Title>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Informations du destinataire */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Informations du destinataire</h4>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Nom</dt>
                            <dd className="mt-1 text-sm text-gray-900">{parcel.recipient?.name || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                            <dd className="mt-1 text-sm text-gray-900">{parcel.recipient?.phone || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                            <dd className="mt-1 text-sm text-gray-900">{parcel.recipient?.email || '-'}</dd>
                          </div>
                        </dl>
                      </div>

                      {/* Informations du colis */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Informations du colis</h4>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Poids</dt>
                            <dd className="mt-1 text-sm text-gray-900">{parcel.weight} kg</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Dimensions</dt>
                            <dd className="mt-1 text-sm text-gray-900">{parcel.dimensions || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Type d'envoi</dt>
                            <dd className="mt-1 text-sm text-gray-900">{parcel.shipping_type || 'Standard'}</dd>
                          </div>
                        </dl>
                      </div>

                      {/* Statut et dates */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Suivi</h4>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Statut</dt>
                            <dd className="mt-1">
                              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${statuses[parcel.status]?.color || 'bg-gray-50 text-gray-700'}`}>
                                {statuses[parcel.status]?.label || parcel.status}
                              </span>
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Date de création</dt>
                            <dd className="mt-1 text-sm text-gray-900">{formatDate(parcel.created_at)}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Date d'envoi</dt>
                            <dd className="mt-1 text-sm text-gray-900">{formatDate(parcel.shipping_date)}</dd>
                          </div>
                        </dl>
                      </div>

                      {/* Prix et instructions */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Prix et instructions</h4>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Prix à payer</dt>
                            <dd className="mt-1 text-sm text-gray-900">{formatPrice(parcel.price)}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Instructions spéciales</dt>
                            <dd className="mt-1 text-sm text-gray-900">{parcel.instructions || '-'}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {/* Photos */}
                    {parcel.photo_urls && parcel.photo_urls.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Photos</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {parcel.photo_urls.map((url, index) => (
                            <div key={index} className="relative aspect-square">
                              <img
                                src={url}
                                alt={`Photo ${index + 1}`}
                                className="absolute inset-0 h-full w-full object-cover rounded-lg"
                              />
                            </div>
                          ))}
                        </div>
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
  )
}
