import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import SearchBar from '../../components/SearchBar';
import DisputeDetailsModal from '../../components/DisputeDetailsModal';
import { 
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const statusIcons = {
  pending: ClockIcon,
  in_progress: ExclamationCircleIcon,
  resolved: CheckCircleIcon
};

const statusColors = {
  pending: 'text-yellow-500',
  in_progress: 'text-blue-500',
  resolved: 'text-green-500'
};

export default function Disputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          id,
          parcel_id,
          status,
          description,
          resolution_notes,
          priority,
          resolution_deadline,
          created_at,
          updated_at,
          parcel:parcels!parcel_id (
            id,
            tracking_number,
            status,
            photo_urls,
            recipient: recipients!recipient_id (
              name,
              phone
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDisputes(data || []);
    } catch (error) {
      console.error('Error fetching disputes:', error);
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

  const handleRowClick = (dispute) => {
    setSelectedDispute(dispute);
    setIsModalOpen(true);
  };

  const filteredDisputes = disputes.filter(dispute => {
    const searchLower = searchQuery.toLowerCase();
    return (
      dispute.parcel?.tracking_number?.toLowerCase().includes(searchLower) ||
      dispute.parcel?.recipient?.name?.toLowerCase().includes(searchLower) ||
      dispute.parcel?.recipient?.phone?.includes(searchQuery) ||
      dispute.description?.toLowerCase().includes(searchLower)
    );
  });

  const updateDisputeStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('disputes')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      fetchDisputes();
    } catch (error) {
      console.error('Error updating dispute status:', error);
    }
  };

  const updateDisputePriority = async (id, newPriority) => {
    try {
      const { error } = await supabase
        .from('disputes')
        .update({ priority: newPriority, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      fetchDisputes();
    } catch (error) {
      console.error('Error updating dispute priority:', error);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">
            Litiges
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste des colis en litige et suivi des dossiers
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mt-4 mb-6">
        <SearchBar
          placeholder="Rechercher par N° de suivi, destinataire ou description..."
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

      {/* Vue mobile */}
      <div className="block sm:hidden">
        {loading ? (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Aucun litige trouvé
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDisputes.map((dispute) => {
              const StatusIcon = statusIcons[dispute.status];
              return (
                <div key={dispute.id} className="bg-white shadow rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">
                        {dispute.parcel?.tracking_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {dispute.parcel?.recipient?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {dispute.parcel?.recipient?.phone}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRowClick(dispute)}
                      className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                    >
                      Voir
                    </button>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500">Priorité</label>
                        <select
                          value={dispute.priority}
                          onChange={(e) => updateDisputePriority(dispute.id, e.target.value)}
                          className={`mt-1 block w-full rounded-md text-xs font-medium ${priorityColors[dispute.priority]}`}
                        >
                          <option value="low">Faible</option>
                          <option value="medium">Moyenne</option>
                          <option value="high">Haute</option>
                          <option value="urgent">Urgente</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Statut</label>
                        <div className="mt-1 flex items-center gap-2">
                          <select
                            value={dispute.status}
                            onChange={(e) => updateDisputeStatus(dispute.id, e.target.value)}
                            className="block w-full rounded-md border-gray-300 text-sm"
                          >
                            <option value="pending">En attente</option>
                            <option value="in_progress">En cours</option>
                            <option value="resolved">Résolu</option>
                          </select>
                          <StatusIcon 
                            className={`h-5 w-5 ${statusColors[dispute.status]}`}
                            aria-hidden="true"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <label className="text-xs text-gray-500">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{dispute.description}</p>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <label className="text-xs text-gray-500">Date de création</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {format(new Date(dispute.created_at), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vue desktop */}
      <div className="hidden sm:block">
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Colis
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Priorité
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Statut
                      </th>
                      <th scope="col" className="hidden md:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Description
                      </th>
                      <th scope="col" className="hidden lg:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Date de création
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                          </div>
                        </td>
                      </tr>
                    ) : filteredDisputes.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-gray-500">
                          Aucun litige trouvé
                        </td>
                      </tr>
                    ) : (
                      filteredDisputes.map((dispute) => {
                        const StatusIcon = statusIcons[dispute.status];
                        return (
                          <tr key={dispute.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                              <div className="font-medium text-gray-900">
                                {dispute.parcel?.tracking_number}
                              </div>
                              <div className="text-gray-500">
                                {dispute.parcel?.recipient?.name}
                              </div>
                              <div className="text-gray-500">
                                {dispute.parcel?.recipient?.phone}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <select
                                value={dispute.priority}
                                onChange={(e) => updateDisputePriority(dispute.id, e.target.value)}
                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[dispute.priority]}`}
                              >
                                <option value="low">Faible</option>
                                <option value="medium">Moyenne</option>
                                <option value="high">Haute</option>
                                <option value="urgent">Urgente</option>
                              </select>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <div className="flex items-center gap-2">
                                <select
                                  value={dispute.status}
                                  onChange={(e) => updateDisputeStatus(dispute.id, e.target.value)}
                                  className="rounded-md border-gray-300 text-sm"
                                >
                                  <option value="pending">En attente</option>
                                  <option value="in_progress">En cours</option>
                                  <option value="resolved">Résolu</option>
                                </select>
                                <StatusIcon 
                                  className={`h-5 w-5 ${statusColors[dispute.status]}`}
                                  aria-hidden="true"
                                />
                              </div>
                            </td>
                            <td className="hidden md:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {dispute.description}
                            </td>
                            <td className="hidden lg:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {format(new Date(dispute.created_at), 'dd MMMM yyyy', { locale: fr })}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <button
                                onClick={() => handleRowClick(dispute)}
                                className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                              >
                                Voir les détails
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de détails */}
      <DisputeDetailsModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        dispute={selectedDispute}
      />
    </div>
  );
}
