import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

const disputeTypes = [
  { value: 'damage', label: 'Dommage' },
  { value: 'loss', label: 'Perte' },
  { value: 'delay', label: 'Retard' },
  { value: 'wrong_delivery', label: 'Erreur de livraison' },
  { value: 'customs', label: 'Problème de douane' },
  { value: 'other', label: 'Autre' },
]

export function CreateDispute() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const parcelId = searchParams.get('parcel')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const { data: parcel, isLoading: isLoadingParcel } = useQuery({
    queryKey: ['parcel', parcelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parcels')
        .select('*')
        .eq('id', parcelId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!parcelId,
  })

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)

      // Créer le litige
      const { data: dispute, error } = await supabase
        .from('disputes')
        .insert([{
          parcel_id: parcelId,
          type: data.type,
          description: data.description,
          status: 'open'
        }])
        .select()
        .single()

      if (error) throw error

      // Mettre à jour le statut du colis
      const { error: parcelError } = await supabase
        .from('parcels')
        .update({ 
          status: 'dispute',
          updated_at: new Date().toISOString()
        })
        .eq('id', parcelId)

      if (parcelError) throw parcelError

      toast.success('Litige créé avec succès')
      navigate(`/disputes/${dispute.id}`)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la création du litige')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingParcel) {
    return <div>Chargement...</div>
  }

  if (!parcel) {
    return <div>Colis non trouvé</div>
  }

  return (
    <div className="space-y-10 divide-y divide-gray-900/10">
      <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
        <div className="px-4 sm:px-0">
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Créer un litige
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Veuillez fournir les détails du problème rencontré avec ce colis.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2"
        >
          <div className="px-4 py-6 sm:p-8">
            <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8">
              <div className="col-span-full">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-900">
                    Informations du colis
                  </h3>
                  <dl className="mt-2 divide-y divide-gray-200">
                    <div className="flex justify-between py-2">
                      <dt className="text-sm text-gray-600">N° de suivi</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {parcel.tracking_number}
                      </dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm text-gray-600">Expéditeur</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {parcel.sender_name}
                      </dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm text-gray-600">Destinataire</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {parcel.receiver_name}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="col-span-full">
                <label
                  htmlFor="type"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Type de problème
                </label>
                <div className="mt-2">
                  <select
                    id="type"
                    {...register('type', { required: 'Ce champ est requis' })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  >
                    <option value="">Sélectionner un type</option>
                    {disputeTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.type.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="col-span-full">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Description détaillée
                </label>
                <div className="mt-2">
                  <textarea
                    id="description"
                    rows={4}
                    {...register('description', {
                      required: 'Ce champ est requis',
                      minLength: {
                        value: 20,
                        message: 'La description doit contenir au moins 20 caractères'
                      }
                    })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                    placeholder="Veuillez décrire le problème en détail..."
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Création...' : 'Créer le litige'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
