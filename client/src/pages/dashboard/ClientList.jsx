import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ClientList() {
  const [clients, setClients] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let timeoutId;

    const fetchClients = async () => {
      const { data, error } = await supabase
        .from('recipients')
        .select(`
          *,
          parcels:parcels(count)
        `)
        .eq('created_by', user.id);

      if (error) {
        console.error('Erreur lors du chargement des clients:', error);
        toast.error('Erreur lors du chargement des clients');
        return;
      }

      console.log('Clients chargés:', data);
      setClients(data || []);
    };

    if (user) {
      fetchClients();

      const clientSubscription = supabase
        .channel('recipients_channel')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'recipients',
            filter: `created_by=eq.${user.id}`
          },
          () => {
            // Utilisation d'un debounce pour éviter les appels trop fréquents
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              fetchClients();
            }, 500);
          }
        )
        .subscribe();

      return () => {
        clearTimeout(timeoutId);
        clientSubscription.unsubscribe();
      };
    }
  }, [user]);

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd MMM yyyy', { locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return '-';
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Liste des clients</h2>
        <p className="mt-2 text-sm text-gray-700">
          Liste de tous vos clients avec leurs informations de contact
        </p>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Nom
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Téléphone
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Nombre de colis
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date d'ajout
                    </th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {client.name || 'Inconnu'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {client.phone || 'Non spécifié'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {client.email || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {client.parcels?.count || 0}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatDate(client.created_at)}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => navigate(`/dashboard/clients/${client.id}/parcels`)}
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
    </div>
  );
}
