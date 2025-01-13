import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../../components/SearchBar';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline/index.js';

export default function DisputeList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Initialiser searchQuery comme une chaîne vide
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchDisputes();
    }
  }, [user]);

  // Fonction utilitaire pour convertir en chaîne de manière sécurisée
  const safeString = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).toLowerCase();
  };

  // Gestionnaire de recherche sécurisé
  const handleSearch = (e) => {
    // S'assurer que la valeur est toujours une chaîne
    const newValue = e?.target?.value ?? '';
    setSearchQuery(newValue);
  };

  // Fonction de filtrage sécurisée
  const getFilteredDisputes = () => {
    if (!Array.isArray(disputes)) return [];
    
    // Convertir searchQuery en chaîne de manière sécurisée
    const search = safeString(searchQuery);
    
    // Si la recherche est vide, retourner tous les litiges
    if (!search) return disputes;

    return disputes.filter(dispute => {
      // Vérifier si le litige existe
      if (!dispute) return false;

      // Récupérer l'objet parcel de manière sécurisée
      const parcel = dispute.parcel ?? {};

      // Convertir toutes les valeurs en chaînes de manière sécurisée
      const trackingNumber = safeString(parcel.tracking_number);
      const recipientName = safeString(parcel.recipient_name);
      const description = safeString(dispute.description);
      const status = safeString(dispute.status);
      const priority = safeString(dispute.priority);

      // Vérifier si l'un des champs contient le terme de recherche
      return (
        trackingNumber.includes(search) ||
        recipientName.includes(search) ||
        description.includes(search) ||
        status.includes(search) ||
        priority.includes(search)
      );
    });
  };

  // Obtenir les litiges filtrés
  const filteredDisputes = getFilteredDisputes();

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: disputes, error: disputesError } = await supabase
        .from('disputes')
        .select(`
          *,
          parcel:parcels (
            id,
            tracking_number,
            recipient_name,
            destination,
            status,
            destination_country,
            instructions,
            special_instructions
          )
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (disputesError) throw disputesError;

      // S'assurer que disputes est un tableau
      const formattedDisputes = Array.isArray(disputes) ? disputes.map(dispute => ({
        ...dispute,
        parcel: dispute.parcel ?? {},
        tracking_number: dispute.parcel?.tracking_number ?? 'N/A',
        recipient_name: dispute.parcel?.recipient_name ?? 'N/A',
        destination: dispute.parcel?.destination ?? 'N/A',
        destination_country: dispute.parcel?.destination_country ?? 'N/A',
        instructions: dispute.parcel?.instructions ?? 'Aucune instruction',
        special_instructions: dispute.parcel?.special_instructions ?? 'Aucune instruction spéciale'
      })) : [];

      setDisputes(formattedDisputes);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message);
      toast.error('Erreur lors du chargement des litiges');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Résolu':
        return <CheckCircleIcon className="inline-block h-5 w-5 text-green-500 ml-2" />;
      case 'En cours':
        return <ClockIcon className="inline-block h-5 w-5 text-yellow-500 ml-2" />;
      default:
        return <ClockIcon className="inline-block h-5 w-5 text-orange-500 ml-2" />;
    }
  };

  const handleStatusChange = async (disputeId, newStatus) => {
    try {
      const { error } = await supabase
        .from('disputes')
        .update({ status: newStatus })
        .eq('id', disputeId);

      if (error) throw error;
      
      fetchDisputes();
      toast.success('Statut mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handlePriorityChange = async (disputeId, newPriority) => {
    try {
      const { error } = await supabase
        .from('disputes')
        .update({ priority: newPriority })
        .eq('id', disputeId);

      if (error) throw error;
      
      fetchDisputes();
      toast.success('Priorité mise à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la priorité:', error);
      toast.error('Erreur lors de la mise à jour de la priorité');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 m-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Erreur lors du chargement des litiges
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={fetchDisputes}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Réessayer
              </button>
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
          <h1 className="text-xl font-semibold text-gray-900">Litiges</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste des colis en litige et suivi des dossiers
          </p>
        </div>
      </div>

      <div className="mt-4">
        <SearchBar
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Rechercher par N° de suivi, destinataire, description..."
          className="max-w-md"
        />
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                    Colis
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Destinataire
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Priorité
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Statut
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Description
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Date de création
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDisputes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-4 text-center text-sm text-gray-500">
                      Aucun litige trouvé
                    </td>
                  </tr>
                ) : (
                  filteredDisputes.map((dispute) => (
                    <tr key={dispute.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                        {dispute.tracking_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {dispute.recipient_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <select
                          value={dispute.priority || 'Faible'}
                          onChange={(e) => handlePriorityChange(dispute.id, e.target.value)}
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        >
                          <option value="Faible">Faible</option>
                          <option value="Moyenne">Moyenne</option>
                          <option value="Haute">Haute</option>
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <select
                          value={dispute.status}
                          onChange={(e) => handleStatusChange(dispute.id, e.target.value)}
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        >
                          <option value="En attente">En attente</option>
                          <option value="En cours">En cours</option>
                          <option value="Résolu">Résolu</option>
                        </select>
                        {getStatusIcon(dispute.status)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {dispute.description || 'Litige créé automatiquement suite au changement de statut du colis'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {format(new Date(dispute.created_at), 'dd MMMM yyyy', { locale: fr })}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                        <button
                          onClick={() => navigate(`/dashboard/disputes/${dispute.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Voir les détails
                        </button>
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
  );
}
