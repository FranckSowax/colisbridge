import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function ClientList() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const initializeData = async () => {
      console.log('État de l\'authentification:', {
        estAuthentifié: isAuthenticated,
        idUtilisateur: user?.id,
        email: user?.email
      });

      if (!isAuthenticated && !authLoading) {
        console.log('Redirection vers la page de connexion...');
        navigate('/login');
        return;
      }

      if (isAuthenticated) {
        await fetchClients();
      }
    };

    initializeData();
  }, [isAuthenticated, authLoading, user]);

  const fetchClients = async () => {
    try {
      console.log('Récupération des clients...');
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('parcels')
        .select(`
          id,
          recipient_name,
          recipient_phone,
          recipient_email,
          recipient_address,
          created_at,
          created_by
        `)
        .order('created_at', { ascending: false });

      console.log('Réponse Supabase:', {
        donnéesPresentes: !!data,
        nombreDeDonnées: data?.length,
        erreur: error?.message
      });

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('Aucun colis trouvé');
        setClients([]);
        return;
      }

      // Grouper les colis par destinataire
      const clientsMap = data.reduce((acc, parcel) => {
        const key = `${parcel.recipient_name}-${parcel.recipient_phone}`;
        if (!acc[key]) {
          acc[key] = {
            id: key,
            name: parcel.recipient_name || 'Sans nom',
            phone: parcel.recipient_phone || 'Sans téléphone',
            email: parcel.recipient_email || 'Sans email',
            address: parcel.recipient_address || 'Sans adresse',
            parcels_count: 1,
            parcel_ids: [parcel.id]
          };
        } else {
          acc[key].parcels_count += 1;
          acc[key].parcel_ids.push(parcel.id);
          if (new Date(parcel.created_at) < new Date(acc[key].created_at)) {
            acc[key].created_at = parcel.created_at;
          }
        }
        return acc;
      }, {});

      setClients(Object.values(clientsMap));
    } catch (err) {
      console.error('Erreur lors de la récupération des clients:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value.toLowerCase());
  };

  const filteredClients = clients.filter((client) => {
    if (!search) return true;
    return (
      (client.name?.toLowerCase() || '').includes(search) ||
      (client.phone?.toLowerCase() || '').includes(search) ||
      (client.email?.toLowerCase() || '').includes(search) ||
      (client.address?.toLowerCase() || '').includes(search)
    );
  });

  const formatDate = (date) => {
    try {
      return format(new Date(date), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return 'Date invalide';
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // La redirection sera gérée par useEffect
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            Une erreur est survenue lors du chargement des clients
          </div>
          <button
            onClick={fetchClients}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Liste des clients</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste de tous vos clients avec leurs informations de contact
          </p>
        </div>
      </div>

      <div className="mt-8 max-w-3xl mx-auto">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            name="search"
            id="search"
            value={search}
            onChange={handleSearchChange}
            className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            placeholder="Rechercher par nom, téléphone, email ou adresse..."
          />
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
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
                      Adresse
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Nombre de colis
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Client depuis
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => navigate(`/dashboard/clients/${encodeURIComponent(client.id)}`)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {client.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{client.phone}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{client.email}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{client.address}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                          {client.parcels_count}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatDate(client.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredClients.length === 0 && (
                <div className="text-center py-12 bg-white">
                  <p className="text-sm text-gray-500">Aucun client trouvé</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
