import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import {
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

const ITEMS_PER_PAGE = 10

const disputeStatusColors = {
  open: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  in_progress: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  resolved: 'bg-green-50 text-green-700 ring-green-600/20',
  closed: 'bg-gray-50 text-gray-700 ring-gray-600/20',
}

const disputeStatusLabels = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
}

export function DisputeList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['disputes', searchTerm, currentPage],
    queryFn: async () => {
      let query = supabase
        .from('disputes')
        .select(`
          *,
          parcels (
            id,
            tracking_number,
            sender_name,
            receiver_name
          ),
          profiles:created_by (
            first_name,
            last_name
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1)

      if (searchTerm) {
        query = query.or(
          `parcels.tracking_number.ilike.%${searchTerm}%,parcels.sender_name.ilike.%${searchTerm}%,parcels.receiver_name.ilike.%${searchTerm}%`
        )
      }

      const { data, error, count } = await query

      if (error) throw error

      return { disputes: data, total: count }
    },
  })

  const totalPages = data ? Math.ceil(data.total / ITEMS_PER_PAGE) : 0

  if (error) {
    return (
      <div className="text-center text-red-600">
        Une erreur est survenue lors du chargement des litiges
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-semibold leading-7 text-gray-900">
            Litiges
          </h1>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Liste des litiges en cours et résolus
          </p>
        </div>
      </div>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="flex flex-1" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="search-field" className="sr-only">
            Rechercher
          </label>
          <div className="relative w-full">
            <MagnifyingGlassIcon
              className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
              aria-hidden="true"
            />
            <input
              id="search-field"
              className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
              placeholder="Rechercher par numéro de suivi, expéditeur ou destinataire..."
              type="search"
              name="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </form>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Colis
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Statut
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Créé par
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
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        Chargement...
                      </td>
                    </tr>
                  ) : (
                    data?.disputes.map((dispute) => (
                      <tr key={dispute.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <div>N° {dispute.parcels.tracking_number}</div>
                          <div className="text-gray-500">
                            {dispute.parcels.sender_name} → {dispute.parcels.receiver_name}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {dispute.type}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                              disputeStatusColors[dispute.status]
                            }`}
                          >
                            {disputeStatusLabels[dispute.status]}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {dispute.profiles.first_name} {dispute.profiles.last_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(dispute.created_at).toLocaleDateString()}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            to={`/disputes/${dispute.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Détails
                            <ChevronRightIcon className="inline-block w-4 h-4 ml-1" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Précédent
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Suivant
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Affichage de{' '}
                <span className="font-medium">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{' '}
                à{' '}
                <span className="font-medium">
                  {Math.min(currentPage * ITEMS_PER_PAGE, data?.total)}
                </span>{' '}
                sur <span className="font-medium">{data?.total}</span> résultats
              </p>
            </div>
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  <span className="sr-only">Précédent</span>
                  <ChevronRightIcon className="h-5 w-5 rotate-180" aria-hidden="true" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  <span className="sr-only">Suivant</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
