import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { supabase } from '../config/supabaseClient';
import { useParcelPrice } from '../hooks/useParcelPrice';
import { useQueryClient } from '@tanstack/react-query';

export default function EditParcelModal({ isOpen, onClose, parcel, onSuccess }) {
  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_phone: '',
    recipient_email: '',
    recipient_address: '',
    weight: '',
    shipping_type: '',
    instructions: ''
  });

  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (parcel) {
      setFormData({
        recipient_name: parcel.recipient_name || '',
        recipient_phone: parcel.recipient_phone || '',
        recipient_email: parcel.recipient_email || '',
        recipient_address: parcel.recipient_address || '',
        weight: parcel.weight || '',
        shipping_type: parcel.shipping_type || '',
        instructions: parcel.instructions || ''
      });
      fetchParcelPhotos();
    }
  }, [parcel]);

  const fetchParcelPhotos = async () => {
    if (!parcel) return;
    
    try {
      const { data, error } = await supabase
        .from('parcel_photos')
        .select('*')
        .eq('parcel_id', parcel.id);

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast.error('Erreur lors du chargement des photos');
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    setIsUploading(true);

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${parcel.id}/${fileName}`;

        // Upload photo to storage
        const { error: uploadError } = await supabase.storage
          .from('parcel-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('parcel-photos')
          .getPublicUrl(filePath);

        // Save photo reference to database
        const { error: dbError } = await supabase
          .from('parcel_photos')
          .insert({
            parcel_id: parcel.id,
            url: publicUrl,
            filename: fileName
          });

        if (dbError) throw dbError;
      }

      fetchParcelPhotos();
      toast.success('Photos ajoutées avec succès');
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Erreur lors de l\'upload des photos');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoDelete = async (photo) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('parcel-photos')
        .remove([`${parcel.id}/${photo.filename}`]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('parcel_photos')
        .delete()
        .eq('id', photo.id);

      if (dbError) throw dbError;

      setPhotos(photos.filter(p => p.id !== photo.id));
      toast.success('Photo supprimée');
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Erreur lors de la suppression de la photo');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updatedParcel = {
        recipient_name: formData.recipient_name,
        recipient_phone: formData.recipient_phone,
        recipient_email: formData.recipient_email,
        recipient_address: formData.recipient_address,
        weight: parseFloat(formData.weight),
        shipping_type: formData.shipping_type,
        instructions: formData.instructions
      };

      const { error } = await supabase
        .from('parcels')
        .update(updatedParcel)
        .eq('id', parcel.id);

      if (error) throw error;

      // Invalider le cache pour forcer le recalcul du prix
      queryClient.invalidateQueries(['parcel-price', parcel.id]);
      
      toast.success('Colis modifié avec succès');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating parcel:', error);
      toast.error('Erreur lors de la modification du colis');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fermer</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Modifier le colis
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                      <div>
                        <label htmlFor="recipient_name" className="block text-sm font-medium text-gray-700">
                          Nom du destinataire
                        </label>
                        <input
                          type="text"
                          name="recipient_name"
                          id="recipient_name"
                          value={formData.recipient_name}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="recipient_phone" className="block text-sm font-medium text-gray-700">
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          name="recipient_phone"
                          id="recipient_phone"
                          value={formData.recipient_phone}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="recipient_email" className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          name="recipient_email"
                          id="recipient_email"
                          value={formData.recipient_email}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="recipient_address" className="block text-sm font-medium text-gray-700">
                          Adresse
                        </label>
                        <textarea
                          name="recipient_address"
                          id="recipient_address"
                          value={formData.recipient_address}
                          onChange={handleChange}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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
                          onChange={handleChange}
                          step="0.1"
                          min="0"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="shipping_type" className="block text-sm font-medium text-gray-700">
                          Type d'envoi
                        </label>
                        <select
                          name="shipping_type"
                          id="shipping_type"
                          value={formData.shipping_type}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          required
                        >
                          <option value="">Sélectionner un type</option>
                          <option value="Standard">Standard</option>
                          <option value="Express">Express</option>
                          <option value="Maritime">Maritime</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">
                          Instructions
                        </label>
                        <textarea
                          name="instructions"
                          id="instructions"
                          value={formData.instructions}
                          onChange={handleChange}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700">Photos</label>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          {photos.map((photo) => (
                            <div key={photo.id} className="relative group">
                              <img
                                src={photo.url}
                                alt="Photo du colis"
                                className="h-24 w-full object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => handlePhotoDelete(photo)}
                                className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Ajouter des photos
                          </label>
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="flex text-sm text-gray-600">
                                <label
                                  htmlFor="photo-upload"
                                  className="relative cursor-pointer rounded-md bg-white font-medium text-primary-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 hover:text-primary-500"
                                >
                                  <span>Télécharger des photos</span>
                                  <input
                                    id="photo-upload"
                                    name="photo-upload"
                                    type="file"
                                    className="sr-only"
                                    multiple
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    disabled={isUploading}
                                  />
                                </label>
                              </div>
                              <p className="text-xs text-gray-500">PNG, JPG jusqu'à 10MB</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={isSubmitting || isUploading}
                          className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 sm:ml-3 sm:w-auto"
                        >
                          {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={onClose}
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
