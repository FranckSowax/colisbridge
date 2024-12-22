import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../config/supabaseClient';
import Pagination from '../../components/Pagination';
import SearchBar from '../../components/SearchBar';
import { Link } from 'react-router-dom';

const CustomerList = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 10;

  const fetchCustomers = async ({ page, searchTerm }) => {
    let query = supabase
      .from('customers')
      .select('*, parcels(count)')
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (searchTerm) {
      query = query.or(`phone.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    const { data, error, count } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return { customers: data, total: count };
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', page, searchTerm],
    queryFn: () => fetchCustomers({ page, searchTerm }),
    keepPreviousData: true,
  });

  if (isLoading) return <div className="text-center">Chargement...</div>;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Liste des Clients</h1>
        <SearchBar
          value={searchTerm}
          onChange={(value) => setSearchTerm(value)}
          placeholder="Rechercher par nom, téléphone ou email..."
        />
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Téléphone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre de Colis
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.customers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{customer.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{customer.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{customer.parcels?.count || 0}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    to={`/dashboard/customers/${customer.id}`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Voir détails
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={Math.ceil((data?.total || 0) / pageSize)}
        onPageChange={setPage}
      />
    </div>
  );
};

export default CustomerList;
