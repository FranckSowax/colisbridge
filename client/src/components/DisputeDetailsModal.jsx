import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline/index.js'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase } from '../config/supabaseClient'

export default function DisputeDetailsModal({ isOpen, setIsOpen, dispute }) {
  const [description, setDescription] = useState(dispute?.description || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const { error } = await supabase
        .from('disputes')
        .update({ 
          description: description,
          updated_at: new Date().toISOString()
        })
        .eq('id', dispute.id)

      if (error) throw error
      setIsOpen(false)
    } catch (error) {
      console.error('Error updating dispute:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!dispute) return null

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
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
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="sr-only">Fermer</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Détails du litige
                    </Dialog.Title>

                    {/* Informations du colis */}
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900">Informations du colis</h4>
                      <dl className="mt-2 divide-y divide-gray-200">
                        <div className="grid grid-cols-2 gap-4 py-3">
                          <dt className="text-sm font-medium text-gray-500">N° de suivi</dt>
                          <dd className="text-sm text-gray-900">{dispute.parcel?.tracking_number}</dd>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-3">
                          <dt className="text-sm font-medium text-gray-500">Destinataire</dt>
                          <dd className="text-sm text-gray-900">{dispute.parcel?.recipient?.name}</dd>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-3">
                          <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                          <dd className="text-sm text-gray-900">{dispute.parcel?.recipient?.phone}</dd>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-3">
                          <dt className="text-sm font-medium text-gray-500">Statut du colis</dt>
                          <dd className="text-sm text-gray-900">{dispute.parcel?.status}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Photos du colis */}
                    {dispute.parcel?.photo_urls && dispute.parcel.photo_urls.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900">Photos du colis</h4>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          {dispute.parcel.photo_urls.map((photoUrl, index) => (
                            <img
                              key={index}
                              src={photoUrl}
                              alt={`Photo ${index + 1} du colis`}
                              className="h-40 w-full object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description du litige */}
                    <div className="mt-4">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description du litige
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="description"
                          name="description"
                          rows={4}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Informations supplémentaires */}
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900">Informations du litige</h4>
                      <dl className="mt-2 divide-y divide-gray-200">
                        <div className="grid grid-cols-2 gap-4 py-3">
                          <dt className="text-sm font-medium text-gray-500">Date de création</dt>
                          <dd className="text-sm text-gray-900">
                            {format(new Date(dispute.created_at), 'dd MMMM yyyy', { locale: fr })}
                          </dd>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-3">
                          <dt className="text-sm font-medium text-gray-500">Dernière mise à jour</dt>
                          <dd className="text-sm text-gray-900">
                            {format(new Date(dispute.updated_at), 'dd MMMM yyyy', { locale: fr })}
                          </dd>
                        </div>
                        {dispute.resolution_deadline && (
                          <div className="grid grid-cols-2 gap-4 py-3">
                            <dt className="text-sm font-medium text-gray-500">Date limite de résolution</dt>
                            <dd className="text-sm text-gray-900">
                              {format(new Date(dispute.resolution_deadline), 'dd MMMM yyyy', { locale: fr })}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={() => setIsOpen(false)}
                  >
                    Annuler
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
