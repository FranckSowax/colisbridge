import React, { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../config/supabaseClient'

const statusLabels = {
  pending: 'En attente',
  in_transit: 'En transit',
  delivered: 'Livré',
  cancelled: 'Annulé',
}

export default function ParcelList({ customerId }) {
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const { data, isLoading, error } = useQuery({
    queryKey: ['parcels', customerId, currentPage],
    queryFn: async () => {
      const start = (currentPage - 1) * pageSize
      const end = start + pageSize - 1

      const { data, error } = await supabase
        .from('parcels')
        .select('*')
        .eq('customer_id', customerId)
        .range(start, end)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  if (isLoading) return <div>Chargement...</div>
  if (error) return <div>Erreur: {error.message}</div>
  if (!data?.length) return <div>Aucun colis trouvé</div>

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                  Numéro de suivi
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Statut
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Date de création
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((parcel) => (
                <tr key={parcel.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                    {parcel.tracking_number}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {statusLabels[parcel.status]}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(parcel.created_at).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <Link
                      to={`/dashboard/parcels/${parcel.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Voir les détails
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
