import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
    priority: '',
    searchTerm: ''
  });

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('parcels')
        .select('*')
        .eq('status', 'litige')
        .order('created_at', { ascending: false });

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.searchTerm) {
        query = query.or(`description.ilike.%${filters.searchTerm}%,tracking_number.ilike.%${filters.searchTerm}%`);
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

  const updateDisputePriority = async (parcelId, newPriority) => {
    try {
      const { error } = await supabase
        .from('parcels')
        .update({ priority: newPriority })
        .eq('id', parcelId);

      if (error) throw error;
      toast.success('Priorité mise à jour');
      fetchDisputes();
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error('Erreur lors de la mise à jour de la priorité');
    }
  };

  const resolveDispute = async (parcelId) => {
    try {
      const { error } = await supabase
        .from('parcels')
        .update({ 
          status: 'livré',
          resolved_at: new Date().toISOString()
        })
        .eq('id', parcelId);

      if (error) throw error;
      toast.success('Litige résolu');
      fetchDisputes();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error('Erreur lors de la résolution du litige');
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [filters]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Litiges</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste de tous les colis en litige
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      Expéditeur
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Destinataire
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Description
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Priorité
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date de création
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {disputes.map((dispute) => (
                    <tr key={dispute.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="font-medium text-gray-900">
                          {dispute.tracking_number}
                        </div>
                        <div className="text-gray-500">
                          {dispute.type_envoi}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {dispute.expediteur}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {dispute.destinataire}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <div className="max-w-xs overflow-hidden text-ellipsis">
                          {dispute.description}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <select
                          value={dispute.priority || 'normale'}
                          onChange={(e) => updateDisputePriority(dispute.id, e.target.value)}
                          className={`rounded-full px-2 text-xs font-semibold ${PRIORITY_COLORS[dispute.priority || 'normale']}`}
                        >
                          <option value="basse">Basse</option>
                          <option value="normale">Normale</option>
                          <option value="haute">Haute</option>
                          <option value="urgente">Urgente</option>
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <button
                          onClick={() => resolveDispute(dispute.id)}
                          className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                        >
                          Résoudre
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {format(new Date(dispute.created_at), 'dd MMM yyyy', { locale: fr })}
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