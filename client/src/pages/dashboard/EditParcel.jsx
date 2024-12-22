import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'

export function EditParcel() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [photos, setPhotos] = useState([])
  const [newPhotos, setNewPhotos] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletedPhotos, setDeletedPhotos] = useState([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm()

  // Charger les données du colis
  const { data: parcel, isLoading } = useQuery({
    queryKey: ['parcel', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parcels')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      // Charger les photos
      const { data: photos } = await supabase.storage
        .from('parcel-photos')
        .list(id)

      const photosWithUrls = await Promise.all(
        photos.map(async (photo) => {
          const { data: { publicUrl } } = supabase.storage
            .from('parcel-photos')
            .getPublicUrl(`${id}/${photo.name}`)
          
          return {
            name: photo.name,
            url: publicUrl
          }
        })
      )

      return { ...data, photos: photosWithUrls }
    },
  })

  // Mettre à jour le formulaire avec les données du colis
  useEffect(() => {
    if (parcel) {
      reset({
        receiver_name: parcel.receiver_name,
        receiver_address: parcel.receiver_address,
        receiver_phone: parcel.receiver_phone,
        receiver_email: parcel.receiver_email,
        weight: parcel.weight,
        description: parcel.description,
        special_instructions: parcel.special_instructions,
      })
      setPhotos(parcel.photos || [])
    }
  }, [parcel, reset])

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files)
    const newPhotosArray = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setNewPhotos((prev) => [...prev, ...newPhotosArray])
  }

  const removeExistingPhoto = (photoName) => {
    setPhotos((prev) => prev.filter((p) => p.name !== photoName))
    setDeletedPhotos((prev) => [...prev, photoName])
  }

  const removeNewPhoto = (index) => {
    setNewPhotos((prev) => {
      const newArray = [...prev]
      URL.revokeObjectURL(newArray[index].preview)
      newArray.splice(index, 1)
      return newArray
    })
  }

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)

      // Supprimer les photos marquées pour suppression
      if (deletedPhotos.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from('parcel-photos')
          .remove(deletedPhotos.map((name) => `${id}/${name}`))

        if (deleteError) throw deleteError
      }

      // Uploader les nouvelles photos
      if (newPhotos.length > 0) {
        await Promise.all(
          newPhotos.map(async ({ file }) => {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${id}/${fileName}`

            const { error: uploadError } = await supabase.storage
              .from('parcel-photos')
              .upload(filePath, file)

            if (uploadError) throw uploadError
          })
        )
      }

      // Mettre à jour les données du colis
      const { error } = await supabase
        .from('parcels')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Colis mis à jour avec succès')
      queryClient.invalidateQueries(['parcel', id])
      navigate('/parcels')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour du colis')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div>Chargement...</div>
  }

  return (
    <div className="space-y-10 divide-y divide-gray-900/10">
      <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
        <div className="px-4 sm:px-0">
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Modifier le colis
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Modifiez les informations du colis et ajoutez ou supprimez des photos.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2"
        >
          <div className="px-4 py-6 sm:p-8">
            <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              {/* Informations du destinataire */}
              <div className="col-span-full">
                <h3 className="text-base font-semibold leading-7 text-gray-900">
                  Informations du destinataire
                </h3>
                <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="receiver_name"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Nom
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        {...register('receiver_name', {
                          required: 'Ce champ est requis',
                        })}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                      />
                      {errors.receiver_name && (
                        <p className="mt-2 text-sm text-red-600">
                          {errors.receiver_name.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label
                      htmlFor="receiver_phone"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Téléphone
                    </label>
                    <div className="mt-2">
                      <input
                        type="tel"
                        {...register('receiver_phone')}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <label
                      htmlFor="receiver_email"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Email
                    </label>
                    <div className="mt-2">
                      <input
                        type="email"
                        {...register('receiver_email', {
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Adresse email invalide',
                          },
                        })}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                      />
                      {errors.receiver_email && (
                        <p className="mt-2 text-sm text-red-600">
                          {errors.receiver_email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label
                      htmlFor="receiver_address"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Adresse
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        {...register('receiver_address', {
                          required: 'Ce champ est requis',
                        })}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                      />
                      {errors.receiver_address && (
                        <p className="mt-2 text-sm text-red-600">
                          {errors.receiver_address.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations du colis */}
              <div className="col-span-full">
                <h3 className="text-base font-semibold leading-7 text-gray-900">
                  Informations du colis
                </h3>
                <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="weight"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Poids (kg)
                    </label>
                    <div className="mt-2">
                      <input
                        type="number"
                        step="0.1"
                        {...register('weight', {
                          required: 'Ce champ est requis',
                          min: {
                            value: 0.1,
                            message: 'Le poids minimum est de 0.1 kg',
                          },
                        })}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                      />
                      {errors.weight && (
                        <p className="mt-2 text-sm text-red-600">
                          {errors.weight.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Description
                    </label>
                    <div className="mt-2">
                      <textarea
                        {...register('description', {
                          required: 'Ce champ est requis',
                        })}
                        rows={3}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                      />
                      {errors.description && (
                        <p className="mt-2 text-sm text-red-600">
                          {errors.description.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label
                      htmlFor="special_instructions"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Instructions spéciales
                    </label>
                    <div className="mt-2">
                      <textarea
                        {...register('special_instructions')}
                        rows={3}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div className="col-span-full">
                <label
                  htmlFor="photos"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Photos
                </label>

                {/* Photos existantes */}
                {photos.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {photos.map((photo) => (
                      <div
                        key={photo.name}
                        className="group relative aspect-square overflow-hidden rounded-lg"
                      >
                        <img
                          src={photo.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(photo.name)}
                          className="absolute right-2 top-2 rounded-full bg-gray-900/40 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Nouvelles photos */}
                {newPhotos.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {newPhotos.map((photo, index) => (
                      <div
                        key={index}
                        className="group relative aspect-square overflow-hidden rounded-lg"
                      >
                        <img
                          src={photo.preview}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewPhoto(index)}
                          className="absolute right-2 top-2 rounded-full bg-gray-900/40 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input pour ajouter des photos */}
                <div className="mt-4">
                  <input
                    type="file"
                    id="photos"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="photos"
                    className="relative block w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
                  >
                    <PhotoIcon
                      className="mx-auto h-12 w-12 text-gray-400"
                      aria-hidden="true"
                    />
                    <span className="mt-2 block text-sm font-semibold text-gray-900">
                      Ajouter des photos
                    </span>
                  </label>
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
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
