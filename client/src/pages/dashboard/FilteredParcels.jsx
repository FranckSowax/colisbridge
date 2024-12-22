import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import SearchBar from '../../components/SearchBar';

const STATUS_LABELS = {
  recu: 'Reçu',
  expedie: 'Expédié',
  receptionne: 'Réceptionné',
  termine: 'Terminé',
  litige: 'En litige'
};

const STATUS_COLORS = {
  recu: 'bg-blue-100 text-blue-800',
  expedie: 'bg-indigo-100 text-indigo-800',
  receptionne: 'bg-green-100 text-green-800',
  termine: 'bg-gray-100 text-gray-800',
  litige: 'bg-yellow-100 text-yellow-800'
};

export default function FilteredParcels() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const statusFilter = queryParams.get('status');

  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchParcels();
  }, [statusFilter]);

  const fetchParcels = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('parcels')
        .select(`
          *,
          recipient:recipients (
            name,
            phone
          )
        `);

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setParcels(data || []);
    } catch (error) {
      console.error('Error fetching parcels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
    }, 500);
  };

  const filteredParcels = parcels.filter(parcel => {
    const searchLower = searchQuery.toLowerCase();
    return (
      parcel.tracking_number?.toLowerCase().includes(searchLower) ||
      parcel.recipient?.name?.toLowerCase().includes(searchLower) ||
      parcel.recipient?.phone?.includes(searchQuery)
    );
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">
            {statusFilter ? `Colis ${STATUS_LABELS[statusFilter].toLowerCase()}s` : 'Tous les colis'}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste des colis {statusFilter ? `avec le statut "${STATUS_LABELS[statusFilter].toLowerCase()}"` : ''}
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mt-4 mb-6">
        <SearchBar
          placeholder="Rechercher par N° de suivi ou destinataire..."
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
        />
      </div>

      {/* Indicateur de recherche */}
      {isSearching && (
        <div className="flex justify-center items-center h-12">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Table des colis */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      N° de suivi
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Destinataire
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Statut
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date de création
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredParcels.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-gray-500">
                        Aucun colis trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredParcels.map((parcel) => (
                      <tr 
                        key={parcel.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/dashboard/parcels/${parcel.id}`)}
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {parcel.tracking_number}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div>{parcel.recipient?.name}</div>
                          <div>{parcel.recipient?.phone}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[parcel.status]}`}>
                            {STATUS_LABELS[parcel.status]}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(new Date(parcel.created_at), 'dd MMMM yyyy', { locale: fr })}
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
    </div>
  );
}
