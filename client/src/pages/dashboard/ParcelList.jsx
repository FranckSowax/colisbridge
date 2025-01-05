import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import ParcelDetailsModal from '../../components/ParcelDetailsModal';
import DisputeModal from '../../components/DisputeModal';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, EllipsisHorizontalIcon } from '@heroicons/react/20/solid';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { useParcelPrice } from '../../hooks/useParcelPrice';

const COUNTRIES = {
  gabon: { name: 'Gabon', flag: '🇬🇦', currency: 'XAF' },
  togo: { name: 'Togo', flag: '🇹🇬', currency: 'XOF' },
  'côte d\'ivoire': { name: 'Côte d\'Ivoire', flag: '🇨🇮', currency: 'XOF' },
  france: { name: 'France', flag: '🇫🇷', currency: 'EUR' },
  dubai: { name: 'Dubaï', flag: '🇦🇪', currency: 'AED' }
};

const STATUSES = [
  { value: 'recu', label: 'Reçu' },
  { value: 'expedie', label: 'Expédié' },
  { value: 'receptionne', label: 'Réceptionné' },
  { value: 'termine', label: 'Terminé' },
  { value: 'litige', label: 'Litige' }
];

const getStatusColor = (status) => {
  switch (status) {
    case 'recu':
      return 'bg-yellow-100 text-yellow-800';
    case 'expedie':
      return 'bg-blue-100 text-blue-800';
    case 'receptionne':
      return 'bg-green-100 text-green-800';
    case 'termine':
      return 'bg-gray-100 text-gray-800';
    case 'litige':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status) => {
  return STATUSES.find(s => s.value === status)?.label || 'Inconnu';
};

const VALID_STATUSES = ['recu', 'expedie', 'receptionne', 'litige', 'termine'];

const CURRENCY_SYMBOLS = {
  XAF: 'FCFA',
  USD: '$',
  EUR: '€'
};

const getCountryFlag = (countryCode) => {
  const country = COUNTRIES[countryCode.toLowerCase()];
  if (country) {
    return `${country.flag} ${country.name}`;
  }
  return countryCode;
};

const renderSearchSection = () => (
  <div className="mb-6">
    <div className="max-w-3xl mx-auto">
      <div className={`relative rounded-lg shadow-sm`}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        
        <input
          type="text"
          name="search"
          className="block w-full rounded-lg border-gray-300 pl-10 pr-32 focus:outline-none focus:ring-0 focus:border-gray-300 sm:text-sm h-12"
          placeholder="Rechercher par numéro de suivi..."
          value=""
          onChange={() => {}}
          onFocus={() => {}}
          onBlur={() => {}}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center">
          <div className="h-full flex items-center border-l border-gray-300">
            <select
              value="tracking"
              onChange={(e) => {}}
              className="h-full border-transparent bg-transparent py-0 pl-2 pr-7 text-gray-500 focus:border-transparent focus:ring-0 sm:text-sm"
            >
              <option value="tracking">N° de suivi</option>
              <option value="recipient">Destinataire</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ParcelTableRow = ({ parcel, onViewDetails, onStatusChange }) => {
  const { data: priceData } = useParcelPrice(parcel);
  
  return (
    <tr key={parcel.id} className="bg-white">
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500">
        {format(new Date(parcel.created_at), 'dd MMM. yyyy', { locale: fr })}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
        {parcel.tracking_number}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm">
        <div className="text-gray-900">{parcel.recipient_name}</div>
        <div className="text-gray-500 text-xs mt-1">{parcel.recipient_phone}</div>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {getCountryFlag(parcel.country)}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {parcel.shipping_type}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {parcel.weight} kg
      </td>
      <td className="whitespace-nowrap px-3 py-4">
        <select
          value={parcel.status}
          onChange={(e) => onStatusChange(parcel, e.target.value)}
          className={`appearance-none rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(parcel.status)} focus:outline-none`}
        >
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
        {priceData?.formatted || '-'}
      </td>
      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
        <button
          onClick={() => onViewDetails(parcel)}
          className="text-indigo-600 hover:text-indigo-900"
        >
          •••
        </button>
      </td>
    </tr>
  );
};

export default function ParcelList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [parcels, setParcels] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchType, setSearchType] = useState('tracking'); // 'tracking' ou 'recipient'

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchParcels();
    }, 300);

    // Souscrire aux changements de la table parcels
    const subscription = supabase
      .channel('parcels_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parcels'
        },
        (payload) => {
          // Mettre à jour le colis modifié dans le state local
          setParcels(currentParcels => {
            const updatedParcels = [...currentParcels];
            const index = updatedParcels.findIndex(p => p.id === payload.new.id);
            
            if (index !== -1) {
              updatedParcels[index] = payload.new;
            }
            
            return updatedParcels;
          });
        }
      )
      .subscribe();

    return () => {
      clearTimeout(delayDebounceFn);
      subscription.unsubscribe();
    };
  }, [searchQuery, searchType]);

  const fetchParcels = async () => {
    let query = supabase
      .from('parcels')
      .select(`
        id,
        tracking_number,
        recipient_name,
        recipient_phone,
        country,
        shipping_type,
        weight,
        status,
        total_price,
        currency,
        created_at,
        created_by
      `)
      .order('created_at', { ascending: false });

    if (searchQuery) {
      if (searchType === 'tracking') {
        query = query.ilike('tracking_number', `%${searchQuery}%`);
      } else {
        query = query.ilike('recipient_name', `%${searchQuery}%`);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching parcels:', error);
      toast.error('Erreur lors de la récupération des colis');
      return;
    }

    setParcels(data || []);
  };

  const handleStatusChange = async (parcel, newStatus) => {
    try {
      if (newStatus === 'litige') {
        setSelectedParcel(parcel);
        setIsDisputeModalOpen(true);
        return;
      }

      const now = new Date().toISOString();
      const updates = { 
        status: newStatus,
        updated_at: now,
        ...(newStatus === 'expedie' && { shipped_at: now }),
        ...(newStatus === 'receptionne' && { received_at: now }),
        ...(newStatus === 'termine' && { completed_at: now })
      };

      const { error } = await supabase
        .from('parcels')
        .update(updates)
        .eq('id', parcel.id);

      if (error) throw error;

      // Mettre à jour l'état local immédiatement
      setParcels(currentParcels => {
        return currentParcels.map(p => {
          if (p.id === parcel.id) {
            return { ...p, ...updates };
          }
          return p;
        });
      });

      toast.success(`Statut mis à jour : ${getStatusLabel(newStatus)}`);
    } catch (error) {
      console.error('Error updating parcel status:', error);
      toast.error('Une erreur est survenue lors de la mise à jour du statut');
    }
  };

  const handleDisputeSubmit = async ({ description, priority }) => {
    try {
      const now = new Date().toISOString();

      // Créer d'abord le litige
      const { error: disputeError } = await supabase
        .from('disputes')
        .insert({
          parcel_id: selectedParcel.id,
          description,
          priority,
          status: 'ouvert',
          created_at: now,
          created_by: user?.id
        });

      if (disputeError) {
        console.error('Error creating dispute:', disputeError);
        toast.error('Erreur lors de la création du litige');
        return;
      }

      // Ensuite mettre à jour le statut du colis
      const { error: updateError } = await supabase
        .from('parcels')
        .update({
          status: 'litige',
          updated_at: now
        })
        .eq('id', selectedParcel.id);

      if (updateError) {
        console.error('Error updating parcel status:', updateError);
        toast.error('Erreur lors de la mise à jour du statut');
        return;
      }

      toast.success('Litige créé avec succès');
      setIsDisputeModalOpen(false);
      setSelectedParcel(null);
    } catch (error) {
      console.error('Error in dispute creation:', error);
      toast.error('Une erreur est survenue lors de la création du litige');
    }
  };

  const handleViewDetails = (parcel) => {
    setSelectedParcel(parcel);
    setIsModalOpen(true);
  };

  const closeDrawer = () => {
    setIsModalOpen(false);
    setSelectedParcel(null);
  };

  if (!parcels.length && !searchQuery) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Bienvenue, {user?.email}</h1>
        
        {/* Liste des colis récents */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900">Colis récents</h2>
          {renderSearchSection()}
          <div className="mt-4">
            <div className="mt-8">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Date
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Numéro de suivi
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Destinataire
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Pays
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Type d'envoi
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Poids / CBM
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Statut
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Prix Total
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {parcels.map((parcel) => (
                        <ParcelTableRow 
                          key={parcel.id}
                          parcel={parcel}
                          onViewDetails={handleViewDetails}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedParcel && (
        <ParcelDetailsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedParcel(null);
          }}
          parcel={selectedParcel}
        />
      )}
    </div>
  );
}
