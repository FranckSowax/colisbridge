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
            file_name: fileName
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
        .remove([`${parcel.id}/${photo.file_name}`]);

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
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 mb-4"
                >
                  Modifier le colis
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-4">
                    {/* Informations de base */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Nom du destinataire
                        </label>
                        <input
                          type="text"
                          name="recipient_name"
                          value={formData.recipient_name}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          name="recipient_phone"
                          value={formData.recipient_phone}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          name="recipient_email"
                          value={formData.recipient_email}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Adresse
                        </label>
                        <textarea
                          name="recipient_address"
                          value={formData.recipient_address}
                          onChange={handleChange}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    {/* Photos */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Photos
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {photos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img
                              src={photo.url}
                              alt={`Photo ${index + 1}`}
                              className="h-24 w-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handlePhotoDelete(photo)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <label className="relative h-24 w-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                          <PhotoIcon className="h-8 w-8 text-gray-400" />
                        </label>
                      </div>
                    </div>

                    {/* Autres informations */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Poids (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          name="weight"
                          value={formData.weight}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Type d'envoi
                        </label>
                        <select
                          name="shipping_type"
                          value={formData.shipping_type}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="">Sélectionner un type</option>
                          <option value="Standard">Standard</option>
                          <option value="Express">Express</option>
                          <option value="Maritime">Maritime</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Instructions
                      </label>
                      <textarea
                        name="instructions"
                        value={formData.instructions}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
