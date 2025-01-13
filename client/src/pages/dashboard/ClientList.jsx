import { useState } from 'react';
import { ClientSearch } from '@/components/clients/ClientSearch';
import { ClientTable } from '@/components/clients/ClientTable';
import { ClientStats } from '@/components/clients/ClientStats';
import { useClientData } from '@/hooks/useClientData';

export function ClientList() {
  const [searchQuery, setSearchQuery] = useState('');
  const { clients, loading, error } = useClientData(searchQuery);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
          </div>
        </div>
        <div className="mt-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur lors du chargement des clients</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste de tous les clients ayant effectué des envois.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ClientStats />
      </div>
      
      <div className="mt-8">
        <ClientSearch onSearch={setSearchQuery} />
      </div>

      <ClientTable clients={clients} />
    </div>
  );
}
