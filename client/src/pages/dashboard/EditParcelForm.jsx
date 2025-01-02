import { Fragment, useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../config/supabaseClient';
import { toast } from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';

export default function EditParcelForm({ open, setOpen, parcel, onUpdate }) {
  const [formData, setFormData] = useState({
    tracking_number: '',
    recipient_name: '',
    recipient_phone: '',
    recipient_address: '',
    destination_country: '',
    weight: '',
    total_amount: '',
    notes: '',
  });
  
  const [uploading, setUploading] = useState(false);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [photosToDelete, setPhotosToDelete] = useState([]);

  useEffect(() => {
    if (parcel) {
      setFormData({
        tracking_number: parcel.tracking_number || '',
        recipient_name: parcel.recipient_name || '',
        recipient_phone: parcel.recipient_phone || '',
        recipient_address: parcel.recipient_address || '',
        destination_country: parcel.destination_country || '',
        weight: parcel.weight || '',
        total_amount: parcel.total_amount || '',
        notes: parcel.notes || '',
      });
      fetchExistingPhotos();
    }
  }, [parcel]);

  const fetchExistingPhotos = async () => {
    if (!parcel?.id) return;
    
    try {
      const { data: files, error } = await supabase.storage
        .from('parcel-photos')
        .list(parcel.id);

      if (error) {
        console.error('Erreur lors de la récupération des photos:', error);
        return;
      }

      if (files && files.length > 0) {
        const photos = files
          .filter(file => file.name.match(/\.(jpg|jpeg|png|gif)$/i))
          .map(file => {
            const { data } = supabase.storage
              .from('parcel-photos')
              .getPublicUrl(`${parcel.id}/${file.name}`);
            return {
              name: file.name,
              url: data.publicUrl,
              path: `${parcel.id}/${file.name}`
            };
          });
        setExistingPhotos(photos);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la récupération des photos');
    }
  };

  const onDrop = useCallback(acceptedFiles => {
    if (existingPhotos.length + newPhotos.length + acceptedFiles.length > 5) {
      toast.error('Vous ne pouvez pas ajouter plus de 5 photos au total');
      return;
    }

    const newPreviewPhotos = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));

    setNewPhotos(prev => [...prev, ...newPreviewPhotos]);
  }, [existingPhotos.length, newPhotos.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5242880, // 5MB
    multiple: true
  });

  const removeExistingPhoto = (photo) => {
    setExistingPhotos(prev => prev.filter(p => p.path !== photo.path));
    setPhotosToDelete(prev => [...prev, photo.path]);
  };

  const removeNewPhoto = (photo) => {
    URL.revokeObjectURL(photo.preview);
    setNewPhotos(prev => prev.filter(p => p.preview !== photo.preview));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      // 1. Supprimer les photos marquées pour suppression
      if (photosToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from('parcel-photos')
          .remove(photosToDelete);

        if (deleteError) throw deleteError;
      }

      // 2. Upload des nouvelles photos
      if (newPhotos.length > 0) {
        await Promise.all(
          newPhotos.map(async (photo) => {
            const fileExt = photo.file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${parcel.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('parcel-photos')
              .upload(filePath, photo.file);

            if (uploadError) throw uploadError;
          })
        );
      }

      // 3. Mettre à jour les informations du colis
      const { error: updateError } = await supabase
        .from('parcels')
        .update(formData)
        .eq('id', parcel.id);

      if (updateError) throw updateError;

      toast.success('Colis mis à jour avec succès');
      onUpdate && onUpdate();
      setOpen(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour du colis');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Fermer</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Modifier le colis #{formData.tracking_number}
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                      {/* Informations du destinataire */}
                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="recipient_name" className="block text-sm font-medium text-gray-700">
                            Nom du destinataire
                          </label>
                          <input
                            type="text"
                            name="recipient_name"
                            id="recipient_name"
                            value={formData.recipient_name}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label htmlFor="recipient_phone" className="block text-sm font-medium text-gray-700">
                            Téléphone
                          </label>
                          <input
                            type="text"
                            name="recipient_phone"
                            id="recipient_phone"
                            value={formData.recipient_phone}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label htmlFor="recipient_address" className="block text-sm font-medium text-gray-700">
                            Adresse
                          </label>
                          <input
                            type="text"
                            name="recipient_address"
                            id="recipient_address"
                            value={formData.recipient_address}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label htmlFor="destination_country" className="block text-sm font-medium text-gray-700">
                            Pays de destination
                          </label>
                          <input
                            type="text"
                            name="destination_country"
                            id="destination_country"
                            value={formData.destination_country}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                            Poids (kg)
                          </label>
                          <input
                            type="number"
                            name="weight"
                            id="weight"
                            value={formData.weight}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700">
                            Montant total (€)
                          </label>
                          <input
                            type="number"
                            name="total_amount"
                            id="total_amount"
                            value={formData.total_amount}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                          Notes
                        </label>
                        <textarea
                          name="notes"
                          id="notes"
                          rows={3}
                          value={formData.notes}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      {/* Zone de dépôt des photos */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Photos ({existingPhotos.length + newPhotos.length}/5)
                        </label>
                        
                        <div
                          {...getRootProps()}
                          className={`mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 ${
                            isDragActive ? 'border-indigo-500 bg-indigo-50' : ''
                          }`}
                        >
                          <div className="text-center">
                            <PhotoIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                            <div className="mt-4 flex text-sm leading-6 text-gray-600">
                              <input {...getInputProps()} />
                              <p className="pl-1">
                                {isDragActive
                                  ? 'Déposez les fichiers ici...'
                                  : "Glissez et déposez des photos, ou cliquez pour sélectionner"}
                              </p>
                            </div>
                            <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF jusqu'à 5MB</p>
                          </div>
                        </div>

                        {/* Aperçu des photos */}
                        {(existingPhotos.length > 0 || newPhotos.length > 0) && (
                          <div className="mt-4 grid grid-cols-2 gap-4">
                            {existingPhotos.map((photo, index) => (
                              <div key={photo.path} className="relative">
                                <img
                                  src={photo.url}
                                  alt={`Photo ${index + 1}`}
                                  className="h-24 w-full object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeExistingPhoto(photo)}
                                  className="absolute top-0 right-0 -mt-2 -mr-2 inline-flex items-center justify-center rounded-full bg-red-600 p-1 text-white shadow-sm hover:bg-red-700"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                            {newPhotos.map((photo, index) => (
                              <div key={photo.preview} className="relative">
                                <img
                                  src={photo.preview}
                                  alt={`Nouvelle photo ${index + 1}`}
                                  className="h-24 w-full object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeNewPhoto(photo)}
                                  className="absolute top-0 right-0 -mt-2 -mr-2 inline-flex items-center justify-center rounded-full bg-red-600 p-1 text-white shadow-sm hover:bg-red-700"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={uploading}
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={() => setOpen(false)}
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
