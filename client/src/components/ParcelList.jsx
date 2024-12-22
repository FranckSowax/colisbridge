import React, { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../config/supabaseClient'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const COUNTRIES = {
  france: { name: 'France', flag: '🇫🇷' },
  gabon: { name: 'Gabon', flag: '🇬🇦' },
  togo: { name: 'Togo', flag: '🇹🇬' },
  cote_ivoire: { name: "Côte d'Ivoire", flag: '🇨🇮' },
  dubai: { name: 'Dubaï', flag: '🇦🇪' }
};

const statusLabels = {
  recu: 'Reçu',
  en_transit: 'En transit',
  livre: 'Livré',
  annule: 'Annulé',
}

const statusColors = {
  recu: 'bg-yellow-50 text-yellow-800',
  en_transit: 'bg-blue-50 text-blue-800',
  livre: 'bg-green-50 text-green-800',
  annule: 'bg-red-50 text-red-800',
}

export default function ParcelList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ['parcels', currentPage, searchQuery],
    queryFn: async () => {
      const query = supabase
        .from('parcels')
        .select(`
          *,
          recipients (
            name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query.or(`
          recipients.name.ilike.%${searchQuery}%,
          recipients.phone.ilike.%${searchQuery}%,
          tracking_number.ilike.%${searchQuery}%
        `);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  const filteredData = data || [];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Liste des colis</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste de tous les colis avec leurs détails et statuts
          </p>
        </div>
      </div>

      <div className="mt-4">
        <input
          type="text"
          placeholder="Rechercher par destinataire, téléphone ou N° de suivi..."
          value={searchQuery}
          onChange={handleSearch}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                    Date de création
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Numéro de suivi
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Destinataire
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Destination
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Type d'envoi
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Poids (kg)
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Date d'envoi
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Statut
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((parcel) => (
                  <tr key={parcel.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-0">
                      {format(new Date(parcel.created_at), 'dd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                      {parcel.tracking_number}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{parcel.recipients?.name}</div>
                        <div className="text-gray-500">{parcel.recipients?.phone}</div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {parcel.country && COUNTRIES[parcel.country] ? (
                        <span>
                          {COUNTRIES[parcel.country].flag} {COUNTRIES[parcel.country].name}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {parcel.shipping_type}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {parcel.weight || parcel.cbm ? (
                        parcel.weight ? `${parcel.weight} kg` : `${parcel.cbm} m³`
                      ) : '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {parcel.shipping_date ? 
                        format(new Date(parcel.shipping_date), 'dd MMM yyyy', { locale: fr }) 
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusColors[parcel.status]}`}>
                        {statusLabels[parcel.status]}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
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
    </div>
  );
}
