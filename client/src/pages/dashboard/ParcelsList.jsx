import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../config/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'
import ParcelTable from '../../components/ParcelTable'
import SearchBar from '../../components/SearchBar'
import { Link } from 'react-router-dom'

export default function ParcelsList() {
  const [parcels, setParcels] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const { user } = useAuth()

  const fetchParcels = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data: parcelsData, error: parcelsError } = await supabase
        .from('parcels')
        .select(`
          *,
          recipient:recipients (
            id,
            name,
            phone,
            email,
            address
          )
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (parcelsError) throw parcelsError

      const transformedParcels = parcelsData.map(parcel => ({
        ...parcel,
        recipient_name: parcel.recipient?.name || 'N/A',
        destination_country: parcel.country || 'N/A'
      }))

      setParcels(transformedParcels)
    } catch (error) {
      console.error('Error:', error.message)
      toast.error('Erreur lors du chargement des colis')
    } finally {
      setLoading(false)
    }
  }, [user])

  const handleStatusChange = useCallback(async (parcelId, newStatus) => {
    // Mise à jour optimiste
    setParcels(currentParcels =>
      currentParcels.map(parcel =>
        parcel.id === parcelId
          ? {
              ...parcel,
              status: newStatus,
              ...(newStatus === 'expedie' ? { shipping_date: new Date().toISOString() } : {})
            }
          : parcel
      )
    )

    try {
      const updates = {
        status: newStatus,
        ...(newStatus === 'expedie' ? { shipping_date: new Date().toISOString() } : {})
      }

      const { error } = await supabase
        .from('parcels')
        .update(updates)
        .eq('id', parcelId)

      if (error) throw error

      toast.success('Statut mis à jour avec succès')
      fetchParcels() // Recharger les données pour être sûr d'avoir les bonnes dates
    } catch (error) {
      console.error('Error:', error.message)
      toast.error('Erreur lors de la mise à jour du statut')
      fetchParcels() // Recharger en cas d'erreur
    }
  }, [fetchParcels])

  const handleSearch = (query) => {
    setIsSearching(true);
    // Vous pouvez ajouter ici une logique de recherche plus sophistiquée si nécessaire
    setTimeout(() => {
      setIsSearching(false);
    }, 500);
  };

  useEffect(() => {
    fetchParcels()
  }, [fetchParcels])

  const filteredParcels = parcels.filter(parcel => {
    const searchLower = searchQuery.toLowerCase();
    return (
      parcel.recipient_name?.toLowerCase().includes(searchLower) ||
      parcel.recipient_phone?.includes(searchQuery) ||
      parcel.tracking_number?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-blue-900">Liste des colis</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Liste de tous les colis avec leurs détails et statuts
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mt-4 mb-6 w-full">
        <SearchBar
          placeholder="Rechercher par destinataire, téléphone ou N° de suivi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onSearch={handleSearch}
        />
      </div>

      {/* Indicateur de recherche */}
      {isSearching && (
        <div className="flex justify-center items-center h-12">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <ParcelTable parcels={filteredParcels} onStatusChange={handleStatusChange} />
      )}
    </div>
  )
}
