import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/config/supabaseConfig';
import ParcelDetailsModal from '@/components/ParcelDetailsModal';
import DisputeModal from '@/components/DisputeModal';
import EditParcelModal from '@/components/EditParcelModal';
import DeleteParcelModal from '@/components/DeleteParcelModal';
import ParcelActionsMenu from '@/components/ParcelActionsMenu';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { MagnifyingGlassIcon, EllipsisHorizontalIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useParcelPrice } from '@/hooks/useParcelPrice';
import { generateInvoice } from '@/services/invoiceService';
import PDFViewer from '@/components/PDFViewer';
import { ParcelStats } from '@/components/parcels/ParcelStats';

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

const SearchBar = ({ searchQuery, onSearchChange, isSearchFocused, setIsSearchFocused }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-6 px-4 sm:px-6 lg:px-8">
      <div className="relative max-w-3xl mx-auto">
        <div
          className={`transition-all duration-300 ease-in-out ${
            isExpanded ? 'w-full' : 'w-full'
          }`}
        >
          <div className="relative">
            <div className="flex">
              <div className="relative flex-grow">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon
                    className="h-6 w-6 text-slate-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-lg border-0 py-3 pl-12 pr-4 text-slate-900 ring-1 ring-inset ring-gray-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Rechercher un colis..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => {
                    setIsSearchFocused(true);
                    setIsExpanded(true);
                  }}
                  onBlur={() => {
                    setIsSearchFocused(false);
                    setIsExpanded(false);
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ParcelTableRow = ({ parcel, onViewDetails, onStatusChange, onEdit, onDelete, onViewInvoice }) => {
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
        <ParcelActionsMenu
          onEdit={() => onEdit(parcel)}
          onDelete={() => onDelete(parcel)}
          onViewInvoice={() => onViewInvoice(parcel)}
          onViewDetails={() => onViewDetails(parcel)}
        />
      </td>
    </tr>
  );
};

export default function ParcelList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

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
      query = query.ilike('tracking_number', `%${searchQuery}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  };

  const { data: parcels = [], refetch } = useQuery({
    queryKey: ['parcels', searchQuery],
    queryFn: fetchParcels,
    refetchOnWindowFocus: true,
    staleTime: 1000,
  });

  useEffect(() => {
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
        () => {
          // Rafraîchir les données via React Query
          refetch();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [refetch]);

  const handleStatusChange = async (parcel, newStatus) => {
    try {
      if (newStatus === 'litige') {
        setSelectedParcel(parcel);
        setIsDisputeModalOpen(true);
        return;
      }

      const previousStatus = parcel.status;
      const updates = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Mise à jour dans Supabase
      const { error } = await supabase
        .from('parcels')
        .update(updates)
        .eq('id', parcel.id);

      if (error) throw error;

      // Mise à jour des statistiques
      await supabase.rpc('update_parcel_stats', {
        old_status: previousStatus,
        new_status: newStatus,
        p_date: new Date(parcel.created_at).toISOString()
      });

      // Rafraîchir les données
      refetch();
      
      toast.success(`Statut mis à jour: ${newStatus}`);
    } catch (error) {
      console.error('Error updating parcel status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
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

      if (disputeError) throw disputeError;

      // Ensuite mettre à jour le statut du colis
      const { error: updateError } = await supabase
        .from('parcels')
        .update({
          status: 'litige',
          updated_at: now
        })
        .eq('id', selectedParcel.id);

      if (updateError) throw updateError;

      // Invalider les requêtes pour forcer le rafraîchissement
      queryClient.invalidateQueries(['parcels']);
      
      toast.success('Litige créé avec succès');
      setIsDisputeModalOpen(false);
      setSelectedParcel(null);
    } catch (error) {
      console.error('Error in dispute creation:', error);
      toast.error('Une erreur est survenue lors de la création du litige');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedParcel?.id) {
      toast.error('Erreur : ID du colis manquant');
      return;
    }

    try {
      // 1. Vérifier que le colis existe
      const { data: parcelCheck, error: checkError } = await supabase
        .from('parcels')
        .select('id')
        .eq('id', selectedParcel.id);

      if (checkError) throw checkError;
      
      if (!parcelCheck || parcelCheck.length === 0) {
        throw new Error('Le colis n\'existe pas ou a déjà été supprimé');
      }

      // 2. Supprimer les litiges associés
      const { error: disputeError } = await supabase
        .from('disputes')
        .delete()
        .eq('parcel_id', selectedParcel.id);

      if (disputeError) {
        console.error('Erreur lors de la suppression des litiges:', disputeError);
      }

      // 3. Supprimer les notifications
      const { error: notifError } = await supabase
        .from('notifications')
        .delete()
        .eq('parcel_id', selectedParcel.id);

      if (notifError) {
        console.error('Erreur lors de la suppression des notifications:', notifError);
      }

      // 4. Gérer les photos
      const { data: photos, error: photosError } = await supabase
        .from('parcel_photos')
        .select('file_name')
        .eq('parcel_id', selectedParcel.id);

      if (photosError) throw photosError;

      if (photos && photos.length > 0) {
        // 4.1 Supprimer d'abord les références dans la base de données
        const { error: photoDeleteError } = await supabase
          .from('parcel_photos')
          .delete()
          .eq('parcel_id', selectedParcel.id);

        if (photoDeleteError) throw photoDeleteError;

        // 4.2 Ensuite supprimer les fichiers du storage
        const filesToRemove = photos.map(photo => `${selectedParcel.id}/${photo.file_name}`);
        const { error: storageError } = await supabase.storage
          .from('parcel-photos')
          .remove(filesToRemove);

        if (storageError) {
          console.error('Erreur lors de la suppression des fichiers:', storageError);
        }
      }

      // 5. Finalement, supprimer le colis
      const { error: parcelError } = await supabase
        .from('parcels')
        .delete()
        .eq('id', selectedParcel.id);

      if (parcelError) {
        console.error('Erreur lors de la suppression du colis:', parcelError);
        throw parcelError;
      }

      // 6. Invalider les requêtes pour forcer le rafraîchissement
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['parcels'] }),
        queryClient.invalidateQueries({ queryKey: ['statistics'] })
      ]);
      
      toast.success('Colis supprimé avec succès');
    } catch (error) {
      console.error('Error deleting parcel:', error);
      toast.error('Erreur lors de la suppression du colis : ' + (error.message || 'Erreur inconnue'));
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedParcel(null);
    }
  };

  const handleViewDetails = (parcel) => {
    setSelectedParcel(parcel);
    setIsModalOpen(true);
  };

  const handleEdit = (parcel) => {
    setSelectedParcel(parcel);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (parcel) => {
    setSelectedParcel(parcel);
    setIsDeleteModalOpen(true);
  };

  const handleViewInvoice = async (parcel) => {
    try {
      const pdfDoc = await generateInvoice(parcel);
      const pdfBlob = pdfDoc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfUrl);
      setShowPDFViewer(true);
    } catch (error) {
      console.error('Erreur lors de la génération de la facture:', error);
      toast.error('Impossible de générer la facture');
    }
  };

  const handleEditSuccess = () => {
    refetch();
    setIsEditModalOpen(false);
    setSelectedParcel(null);
  };

  const closeDrawer = () => {
    setIsModalOpen(false);
    setSelectedParcel(null);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    // Rafraîchir la requête avec le nouveau terme de recherche
    queryClient.invalidateQueries(['parcels']);
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Gestion des Colis</h1>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        <ParcelStats />
        <div className="bg-white shadow-sm rounded-lg">
          {/* Filtres mobiles */}
          <div className="block sm:hidden p-4 bg-gray-50 border-b">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Rechercher un colis..."
              />
            </div>
          </div>

          {/* Liste pour mobile */}
          <div className="block sm:hidden">
            <div className="space-y-4">
              {parcels.map((parcel) => (
                <div
                  key={parcel.id}
                  className="bg-white shadow rounded-lg overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(parcel.created_at), 'dd MMM. yyyy', { locale: fr })}
                        </p>
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                          {parcel.tracking_number}
                        </p>
                        <p className="text-sm text-gray-500">
                          {parcel.recipient_name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onViewDetails(parcel)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <span className="sr-only">Détails</span>
                          <EllipsisHorizontalIcon className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-500">Pays:</p>
                        <p className="font-medium text-gray-900">
                          {COUNTRIES[parcel.country.toLowerCase()]?.flag} {COUNTRIES[parcel.country.toLowerCase()]?.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Type d'envoi:</p>
                        <p className="font-medium text-gray-900">{parcel.shipping_type}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Poids:</p>
                        <p className="font-medium text-gray-900">{parcel.weight} kg</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Statut:</p>
                        <select
                          value={parcel.status}
                          onChange={(e) => handleStatusChange(parcel, e.target.value)}
                          className={`mt-1 block w-full rounded-md py-1.5 pl-3 pr-10 text-sm ${getStatusColor(parcel.status)} border-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500`}
                        >
                          {STATUSES.map((status) => (
                            <option
                              key={status.value}
                              value={status.value}
                              className="bg-white text-gray-900"
                            >
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tableau pour desktop */}
          <div className="hidden sm:block">
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900">Colis récents</h2>
              <SearchBar
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                isSearchFocused={isSearchFocused}
                setIsSearchFocused={setIsSearchFocused}
              />
              <div className="mt-4">
                <div className="mt-8">
                  <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle">
                      <div className="w-full overflow-x-auto px-4 md:px-6 lg:px-8">
                        <div className="min-w-full bg-white rounded-lg shadow">
                          <table className="min-w-full table-auto">
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
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
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
                                  onEdit={handleEdit}
                                  onDelete={handleDelete}
                                  onViewInvoice={handleViewInvoice}
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
      
      <DisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        parcel={selectedParcel}
        onSubmit={handleDisputeSubmit}
      />
      
      <EditParcelModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        parcel={selectedParcel}
        onSuccess={handleEditSuccess}
      />
      
      <DeleteParcelModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedParcel(null);
        }}
        onConfirm={handleConfirmDelete}
        parcel={selectedParcel}
      />
      
      {showPDFViewer && pdfUrl && (
        <PDFViewer
          url={pdfUrl}
          onClose={() => {
            setShowPDFViewer(false);
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
          }}
        />
      )}
    </div>
  );
}
