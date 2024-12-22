import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '/src/config/supabaseClient'
import { toast } from 'react-hot-toast'

const STATUS_COLORS = {
  recu: 'bg-yellow-50 text-yellow-800',
  expedie: 'bg-blue-50 text-blue-800',
  receptionne: 'bg-green-50 text-green-800',
  termine: 'bg-gray-50 text-gray-800',
}

const STATUS_LABELS = {
  recu: 'Reçu',
  expedie: 'Expédié',
  receptionne: 'Réceptionné',
  termine: 'Terminé',
}

export default function ParcelDetails({ open, setOpen, parcel }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (parcel) {
      fetchPhotos()
    }
  }, [parcel])

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .storage
        .from('parcels-photo')
        .list(`${parcel.created_by}/${parcel.id}`)

      if (error) {
        console.error('Error listing photos:', error)
        throw error
      }

      if (!data || data.length === 0) {
        setPhotos([])
        return
      }

      // Obtenir les URLs des photos
      const photoUrls = await Promise.all(
        data.map(async (photo) => {
          const { data: { publicUrl } } = supabase
            .storage
            .from('parcels-photo')
            .getPublicUrl(`${parcel.created_by}/${parcel.id}/${photo.name}`)
          return {
            name: photo.name,
            url: publicUrl
          }
        })
      )

      setPhotos(photoUrls)
    } catch (error) {
      console.error('Error fetching photos:', error)
      toast.error('Erreur lors du chargement des photos')
    } finally {
      setLoading(false)
    }
  }

  if (!parcel) return null

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

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
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Détails du colis #{parcel.tracking_number}
                    </Dialog.Title>

                    <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Informations du destinataire</h4>
                        <dl className="mt-2 text-sm text-gray-500">
                          <div>
                            <dt className="inline font-medium text-gray-900">Nom: </dt>
                            <dd className="inline">{parcel.receiver_name}</dd>
                          </div>
                          <div>
                            <dt className="inline font-medium text-gray-900">Email: </dt>
                            <dd className="inline">{parcel.receiver_email}</dd>
                          </div>
                          <div>
                            <dt className="inline font-medium text-gray-900">Téléphone: </dt>
                            <dd className="inline">{parcel.receiver_phone}</dd>
                          </div>
                        </dl>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Informations du colis</h4>
                        <dl className="mt-2 text-sm text-gray-500">
                          <div>
                            <dt className="inline font-medium text-gray-900">Pays de destination: </dt>
                            <dd className="inline">{parcel.destination_country}</dd>
                          </div>
                          <div>
                            <dt className="inline font-medium text-gray-900">Poids: </dt>
                            <dd className="inline">{parcel.weight} kg</dd>
                          </div>
                          <div>
                            <dt className="inline font-medium text-gray-900">Statut: </dt>
                            <dd className="inline">
                              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${STATUS_COLORS[parcel.status]}`}>
                                {STATUS_LABELS[parcel.status]}
                              </span>
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="sm:col-span-2">
                        <h4 className="text-sm font-medium text-gray-900">Description</h4>
                        <p className="mt-1 text-sm text-gray-500">{parcel.description}</p>
                      </div>

                      {parcel.special_instructions && (
                        <div className="sm:col-span-2">
                          <h4 className="text-sm font-medium text-gray-900">Instructions spéciales</h4>
                          <p className="mt-1 text-sm text-gray-500">{parcel.special_instructions}</p>
                        </div>
                      )}

                      {photos.length > 0 && (
                        <div className="sm:col-span-2">
                          <h4 className="text-sm font-medium text-gray-900">Photos</h4>
                          <div className="mt-2 grid grid-cols-3 gap-4">
                            {photos.map((photo) => (
                              <div key={photo.name} className="relative aspect-square">
                                <img
                                  src={photo.url}
                                  alt={photo.name}
                                  className="h-full w-full object-cover rounded-lg"
                                />
                              </div>
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
      </Dialog>
    </Transition.Root>
  )
}
