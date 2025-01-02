import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const disputeStatusColors = {
  open: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  in_progress: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  resolved: 'bg-green-50 text-green-700 ring-green-600/20',
  closed: 'bg-gray-50 text-gray-700 ring-gray-600/20',
}

const disputeStatusLabels = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
}

const disputeTypeLabels = {
  damage: 'Dommage',
  loss: 'Perte',
  delay: 'Retard',
  wrong_delivery: 'Erreur de livraison',
  customs: 'Problème de douane',
  other: 'Autre',
}

export function DisputeDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [newNote, setNewNote] = useState('')
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)

  const { data: dispute, isLoading } = useQuery({
    queryKey: ['dispute', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          parcels (
            id,
            tracking_number,
            sender_name,
            receiver_name,
            status,
            destination,
            destination_country,
            instructions,
            special_instructions,
            created_at,
            updated_at
          ),
          profiles:created_by (
            first_name,
            last_name
          ),
          resolver:resolved_by (
            first_name,
            last_name
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
  })

  const updateStatus = useMutation({
    mutationFn: async (newStatus) => {
      const { error } = await supabase
        .from('disputes')
        .update({
          status: newStatus,
          ...(newStatus === 'resolved' || newStatus === 'closed'
            ? {
                resolved_at: new Date().toISOString(),
                resolved_by: user.id,
              }
            : {}),
        })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dispute', id])
      toast.success('Statut mis à jour avec succès')
    },
    onError: (error) => {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour du statut')
    },
  })

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!newNote.trim()) return

    try {
      setIsSubmittingNote(true)
      const { error } = await supabase.from('dispute_notes').insert([
        {
          dispute_id: id,
          content: newNote.trim(),
        },
      ])

      if (error) throw error

      setNewNote('')
      queryClient.invalidateQueries(['dispute', id])
      toast.success('Note ajoutée avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'ajout de la note')
    } finally {
      setIsSubmittingNote(false)
    }
  }

  if (isLoading) {
    return <div>Chargement...</div>
  }

  if (!dispute) {
    return <div>Litige non trouvé</div>
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Litige #{id.slice(0, 8)}
          </h2>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Retour
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Informations du litige */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Informations du litige
            </h3>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {disputeTypeLabels[dispute.type]}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Statut</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      disputeStatusColors[dispute.status]
                    }`}
                  >
                    {disputeStatusLabels[dispute.status]}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {dispute.description}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Créé par</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {dispute.profiles.first_name} {dispute.profiles.last_name}
                </dd>
              </div>
              {dispute.resolved_by && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Résolu par</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {dispute.resolver.first_name} {dispute.resolver.last_name}
                  </dd>
                </div>
              )}
            </dl>

            {/* Actions de statut */}
            <div className="mt-6">
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700"
              >
                Changer le statut
              </label>
              <select
                id="status"
                value={dispute.status}
                onChange={(e) => updateStatus.mutate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
              >
                {Object.entries(disputeStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Informations du colis */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Informations du colis
            </h3>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Numéro de suivi
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {dispute.parcels.tracking_number}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Expéditeur</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {dispute.parcels.sender_name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Destinataire</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {dispute.parcels.receiver_name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Destination</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {dispute.parcels.destination}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Pays de destination</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {dispute.parcels.destination_country}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Instructions</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {dispute.parcels.instructions || 'Aucune instruction'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Instructions spéciales</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {dispute.parcels.special_instructions || 'Aucune instruction spéciale'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date de création du colis</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {dispute.parcels.created_at ? format(new Date(dispute.parcels.created_at), 'dd MMMM yyyy', { locale: fr }) : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Dernière mise à jour du colis</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {dispute.parcels.updated_at ? format(new Date(dispute.parcels.updated_at), 'dd MMMM yyyy', { locale: fr }) : 'N/A'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Section des notes */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Notes
          </h3>

          {/* Formulaire d'ajout de note */}
          <form onSubmit={handleAddNote} className="mt-4">
            <div>
              <label htmlFor="note" className="sr-only">
                Ajouter une note
              </label>
              <textarea
                id="note"
                name="note"
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Ajouter une note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
            </div>
            <div className="mt-3">
              <button
                type="submit"
                disabled={isSubmittingNote || !newNote.trim()}
                className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingNote ? 'Ajout...' : 'Ajouter une note'}
              </button>
            </div>
          </form>

          {/* Liste des notes */}
          <div className="mt-6 space-y-4">
            {/* Vous devrez ajouter la logique pour afficher les notes ici */}
          </div>
        </div>
      </div>
    </div>
  )
}
