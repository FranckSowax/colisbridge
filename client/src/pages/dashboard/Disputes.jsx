import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { toast } from 'react-hot-toast';

const DISPUTE_STATUS_COLORS = {
  ouvert: 'bg-red-100 text-red-800',
  en_cours: 'bg-yellow-100 text-yellow-800',
  resolu: 'bg-green-100 text-green-800',
  annule: 'bg-gray-100 text-gray-800'
};

const PRIORITY_COLORS = {
  basse: 'bg-blue-100 text-blue-800',
  normale: 'bg-gray-100 text-gray-800',
  haute: 'bg-orange-100 text-orange-800',
  urgente: 'bg-red-100 text-red-800'
};

export default function Disputes() {
  const { supabase } = useSupabase();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    searchTerm: ''
  });

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('disputes')
        .select(`
          *,
          parcels (
            tracking_number,
            destinataire,
            pays,
            type_envoi
          )
        `)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.searchTerm) {
        query = query.or(`description.ilike.%${filters.searchTerm}%,parcels.tracking_number.ilike.%${filters.searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDisputes(data);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast.error('Erreur lors du chargement des litiges');
    } finally {
      setLoading(false);
    }
  };

  const updateDisputeStatus = async (disputeId, newStatus) => {
    try {
      const updates = {
        status: newStatus,
        ...(newStatus === 'resolu' && { resolved_at: new Date().toISOString() })
      };

      const { error } = await supabase
        .from('disputes')
        .update(updates)
        .eq('id', disputeId);

      if (error) throw error;
      
      toast.success('Statut du litige mis à jour');
      fetchDisputes();
    } catch (error) {
      console.error('Error updating dispute:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [filters]);

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Litiges</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste de tous les litiges avec leur statut et détails
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <select
          value={filters.status}
          onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="ouvert">Ouvert</option>
          <option value="en_cours">En cours</option>
          <option value="resolu">Résolu</option>
          <option value="annule">Annulé</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Toutes les priorités</option>
          <option value="basse">Basse</option>
          <option value="normale">Normale</option>
          <option value="haute">Haute</option>
          <option value="urgente">Urgente</option>
        </select>

        <input
          type="text"
          placeholder="Rechercher..."
          value={filters.searchTerm}
          onChange={(e) => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      {/* Table des litiges */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Colis
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Description
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Priorité
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Statut
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date de création
                    </th>
                    <th className="relative px-3 py-3.5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {disputes.map((dispute) => (
                    <tr key={dispute.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="font-medium text-gray-900">
                          {dispute.parcels.tracking_number}
                        </div>
                        <div className="text-gray-500">
                          {dispute.parcels.destinataire}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <div className="max-w-xs overflow-hidden text-ellipsis">
                          {dispute.description}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${PRIORITY_COLORS[dispute.priority]}`}>
                          {dispute.priority}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <select
                          value={dispute.status}
                          onChange={(e) => updateDisputeStatus(dispute.id, e.target.value)}
                          className={`rounded-full px-2 text-xs font-semibold ${DISPUTE_STATUS_COLORS[dispute.status]}`}
                        >
                          <option value="ouvert">Ouvert</option>
                          <option value="en_cours">En cours</option>
                          <option value="resolu">Résolu</option>
                          <option value="annule">Annulé</option>
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(dispute.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}