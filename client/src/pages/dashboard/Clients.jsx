import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import SearchBar from '../../components/SearchBar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ClientParcelsModal from '../../components/ClientParcelsModal';
import ClientCard from '../../components/ClientCard';
import { useAuth } from '../../context/AuthContext';

export default function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showParcelsModal, setShowParcelsModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recipients')
        .select(`
          *,
          parcels:parcels(count)
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchQuery.toLowerCase();
    return (
      client.name?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.phone?.includes(searchQuery) ||
      client.address?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  };

  const handleViewParcels = (client) => {
    setSelectedClient(client);
    setShowParcelsModal(true);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Liste des clients</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste de tous vos clients avec leurs informations de contact
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mt-4 mb-6">
        <SearchBar
          placeholder="Rechercher par nom, email, téléphone ou adresse..."
          onSearch={handleSearch}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">Aucun client trouvé</p>
        </div>
      ) : (
        <>
          {/* Vue mobile : Cartes */}
          <div className="lg:hidden space-y-4">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onViewParcels={handleViewParcels}
              />
            ))}
          </div>

          {/* Vue desktop : Tableau */}
          <div className="hidden lg:block mt-8">
            <div className="-mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Nom
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Téléphone
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Email
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Nombre de colis
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Date d'ajout
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredClients.map((client) => (
                        <tr key={client.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {client.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {client.phone}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {client.email || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {client.parcels?.[0]?.count || 0}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatDate(client.created_at)}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => handleViewParcels(client)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Voir les colis
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
        </>
      )}

      {selectedClient && (
        <ClientParcelsModal
          isOpen={showParcelsModal}
          onClose={() => {
            setShowParcelsModal(false);
            setSelectedClient(null);
          }}
          clientId={selectedClient.id}
          clientName={selectedClient.name}
        />
      )}
    </div>
  );
}
