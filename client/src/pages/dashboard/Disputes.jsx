import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDisputes } from '../../hooks/useDisputes';
import { useLanguage } from '../../context/LanguageContext';
import { Dialog } from '@headlessui/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames';

// Composant de modal pour créer/éditer un litige
function DisputeModal({ isOpen, onClose, dispute = null, onSubmit }) {
  const [formData, setFormData] = useState(
    dispute || {
      title: '',
      description: '',
      priority: 'medium',
      status: 'open',
      parcel_id: '',
      resolution_notes: '',
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg rounded-xl bg-white p-6">
          <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
            {dispute ? 'Modifier le litige' : 'Nouveau litige'}
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Titre
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Priorité
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, priority: e.target.value }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {Object.entries(DISPUTE_PRIORITIES).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Statut
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {Object.entries(DISPUTE_STATUSES).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {formData.status === 'resolved' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes de résolution
                </label>
                <textarea
                  value={formData.resolution_notes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      resolution_notes: e.target.value,
                    }))
                  }
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            )}
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button
                type="submit"
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
              >
                {dispute ? 'Mettre à jour' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
              >
                Annuler
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default function Disputes() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const {
    disputes,
    isLoading,
    error,
    createDispute,
    updateDispute,
    deleteDispute,
    searchQuery,
    handleSearch,
    filters,
    handleFilterChange,
    DISPUTE_PRIORITIES,
    DISPUTE_STATUSES,
  } = useDisputes(user?.id);

  const handleCreateDispute = (formData) => {
    createDispute.mutate(formData);
  };

  const handleUpdateDispute = (formData) => {
    updateDispute.mutate({ id: selectedDispute.id, ...formData });
  };

  const handleOpenModal = (dispute = null) => {
    setSelectedDispute(dispute);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Une erreur est survenue: {error.message}
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Litiges</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste des litiges et réclamations
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Nouveau litige
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex-1 max-w-sm">
                <label htmlFor="search" className="sr-only">
                  Rechercher
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    type="search"
                    name="search"
                    id="search"
                    value={searchQuery}
                    onChange={handleSearch}
                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Rechercher un litige..."
                  />
                </div>
              </div>

              <div className="ml-4 flex items-center space-x-4">
                <select
                  value={filters.priority}
                  onChange={(e) =>
                    handleFilterChange({ priority: e.target.value })
                  }
                  className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Toutes les priorités</option>
                  {Object.entries(DISPUTE_PRIORITIES).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange({ status: e.target.value })}
                  className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Tous les statuts</option>
                  {Object.entries(DISPUTE_STATUSES).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Titre
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Priorité
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Statut
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Date de création
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {disputes.map((dispute) => (
                    <tr key={dispute.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="font-medium text-gray-900">
                          {dispute.title}
                        </div>
                        <div className="text-gray-500">
                          {dispute.parcels?.tracking_number}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span
                          className={classNames(
                            DISPUTE_PRIORITIES[dispute.priority].color,
                            'inline-flex rounded-full px-2 text-xs font-semibold leading-5'
                          )}
                        >
                          {DISPUTE_PRIORITIES[dispute.priority].label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span
                          className={classNames(
                            DISPUTE_STATUSES[dispute.status].color,
                            'inline-flex rounded-full px-2 text-xs font-semibold leading-5'
                          )}
                        >
                          {DISPUTE_STATUSES[dispute.status].label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {format(new Date(dispute.created_at), 'Pp', {
                          locale: fr,
                        })}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleOpenModal(dispute)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                'Êtes-vous sûr de vouloir supprimer ce litige ?'
                              )
                            ) {
                              deleteDispute.mutate(dispute.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <DisputeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDispute(null);
        }}
        dispute={selectedDispute}
        onSubmit={selectedDispute ? handleUpdateDispute : handleCreateDispute}
      />
    </div>
  );
}