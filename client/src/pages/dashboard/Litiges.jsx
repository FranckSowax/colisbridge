import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function Litiges() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [litiges, setLitiges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    fetchLitiges();
  }, [user]);

  const fetchLitiges = async () => {
    try {
      setLoading(true);
      // D'abord, récupérer les colis en litige
      const { data: parcelData, error: parcelError } = await supabase
        .from('parcels')
        .select('*')
        .eq('status', 'litige')
        .order('created_at', { ascending: false });

      if (parcelError) throw parcelError;

      // Ensuite, récupérer les informations des destinataires et expéditeurs
      const recipientIds = parcelData.map(p => p.recipient_id).filter(Boolean);
      const senderIds = parcelData.map(p => p.sender_id).filter(Boolean);

      const [recipientsResponse, sendersResponse] = await Promise.all([
        supabase
          .from('recipients')
          .select('id, name')
          .in('id', recipientIds),
        supabase
          .from('recipients')
          .select('id, name')
          .in('id', senderIds)
      ]);

      if (recipientsResponse.error) throw recipientsResponse.error;
      if (sendersResponse.error) throw sendersResponse.error;

      // Créer un map pour un accès rapide
      const recipientsMap = Object.fromEntries(
        recipientsResponse.data.map(r => [r.id, r])
      );
      const sendersMap = Object.fromEntries(
        sendersResponse.data.map(s => [s.id, s])
      );

      // Combiner les données
      const formattedLitiges = parcelData.map(litige => ({
        ...litige,
        sender_name: sendersMap[litige.sender_id]?.name ?? 'N/A',
        recipient_name: recipientsMap[litige.recipient_id]?.name ?? 'N/A',
      }));

      setLitiges(formattedLitiges);
    } catch (error) {
      console.error('Erreur:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  };

  const filteredLitiges = litiges.filter(litige => {
    if (!searchValue.trim()) return true;
    const search = searchValue.toLowerCase();
    
    return (
      litige.sender_name.toLowerCase().includes(search) ||
      litige.recipient_name.toLowerCase().includes(search) ||
      litige.tracking_number?.toLowerCase().includes(search) ||
      litige.description?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Colis en litige</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste de tous les colis signalés en litige
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mt-4 max-w-md">
        <label htmlFor="search" className="sr-only">
          Rechercher
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            id="search"
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Rechercher par expéditeur, destinataire, numéro de suivi..."
          />
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                    N° de suivi
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Expéditeur
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Destinataire
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Date de création
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Description
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredLitiges.map((litige) => (
                  <tr key={litige.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                      {litige.tracking_number}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {litige.sender_name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {litige.recipient_name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDate(litige.created_at)}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {litige.description || '-'}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <button
                        onClick={() => navigate(`/dashboard/parcels/${litige.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Voir les détails
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
  );
}
