import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { supabase } from '../config/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';

export default function NewParcelForm({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    tracking_number: `CB${Date.now()}${Math.floor(Math.random() * 1000)}`,
    destination_country: 'France',
    shipping_type: 'standard',
    weight: '',
    cbm: '',
    instructions: '',
    sender_name: '',
    sender_email: '',
    sender_phone: '',
    sender_address: '',
    recipient_name: '',
    recipient_email: '',
    recipient_phone: '',
    recipient_address: '',
    length: '',
    width: '',
    height: '',
    value: '',
    description: '',
  });
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [newRecipient, setNewRecipient] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [isNewRecipient, setIsNewRecipient] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [photoPreview, setPhotoPreview] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const destinationCountries = [
    { value: 'France', label: 'France' },
    { value: 'Gabon', label: 'Gabon' },
    { value: 'Togo', label: 'Togo' },
    { value: "Côte d'Ivoire", label: "Côte d'Ivoire" },
    { value: 'Dubai', label: 'Dubaï' },
  ];

  const shippingTypes = [
    { value: 'standard', label: 'Standard' },
    { value: 'express', label: 'Express' },
    { value: 'maritime', label: 'Maritime' },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchRecipients();
    }
  }, [isOpen, user]);

  const fetchRecipients = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('recipients')
        .select('*')
        .eq('created_by', user.id)
        .order('name');

      if (error) throw error;

      setRecipients(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des destinataires:', error);
      toast.error('Erreur lors du chargement des destinataires');
    }
  };

  const handleRecipientChange = (e) => {
    const recipientId = e.target.value;
    if (recipientId === 'new') {
      setIsNewRecipient(true);
      setSelectedRecipient(null);
      setNewRecipient({
        name: '',
        phone: '',
        email: '',
      });
    } else {
      setIsNewRecipient(false);
      setSelectedRecipient(recipients.find(r => r.id === recipientId));
      setNewRecipient(null);
    }
  };

  const handleNewRecipientChange = (e) => {
    const { name, value } = e.target;
    setNewRecipient(prev => ({
      ...prev,
      [name]: name === 'phone' ? value.trim() : value
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photos.length > 5) {
      toast.error('Vous ne pouvez pas ajouter plus de 5 photos');
      return;
    }
    
    // Create preview URLs for new files
    const newFiles = files.slice(0, 5 - photos.length);
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    
    setPhotos(prevPhotos => [...prevPhotos, ...newFiles]);
    setPhotoPreview(prevPreviews => [...prevPreviews, ...newPreviews]);
  };

  const removePhoto = (index) => {
    setPhotos(prevPhotos => prevPhotos.filter((_, i) => i !== index));
    setPhotoPreview(prevPreviews => {
      // Révoque l'URL de l'aperçu supprimé
      URL.revokeObjectURL(prevPreviews[index]);
      return prevPreviews.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let recipientId = selectedRecipient?.id;

      // Create new recipient if needed
      if (isNewRecipient && newRecipient) {
        const { data: recipientData, error: recipientError } = await supabase
          .from('recipients')
          .insert([
            {
              ...newRecipient,
              created_by: user.id
            }
          ])
          .select()
          .single();

        if (recipientError) {
          throw new Error(`Erreur lors de la création du destinataire: ${recipientError.message}`);
        }
        recipientId = recipientData.id;
      }

      // Upload photos
      const photoUrls = [];
      if (photos.length > 0) {
        for (const photo of photos) {
          const fileExt = photo.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('parcel-photos')
            .upload(filePath, photo, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            throw new Error(`Erreur lors de l'upload de la photo: ${uploadError.message}`);
          }

          const { data: { publicUrl } } = supabase.storage
            .from('parcel-photos')
            .getPublicUrl(filePath);

          photoUrls.push(publicUrl);
        }
      }

      // Prepare parcel data with proper number handling
      const parcelData = {
        ...formData,
        weight: formData.weight ? Number(formData.weight) : null,
        cbm: formData.cbm ? Number(formData.cbm) : null,
        recipient_id: recipientId,
        photo_urls: photoUrls,
        created_by: user.id,
        status: 'recu'
      };

      // Create parcel
      const { error: parcelError } = await supabase
        .from('parcels')
        .insert([parcelData]);

      if (parcelError) {
        throw new Error(`Erreur lors de la création du colis: ${parcelError.message}`);
      }

      toast.success('Colis créé avec succès');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Erreur lors de la création du colis');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      as="div"
      className="fixed inset-0 z-10 overflow-y-auto"
      onClose={onClose}
      open={isOpen}
    >
      <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="inline-block w-full max-w-2xl transform overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6 bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Informations sur l'expéditeur */}
              <div className="sm:col-span-2 lg:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Informations expéditeur</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="sender_name" className="block text-sm font-medium text-gray-700">
                      Nom complet
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="sender_name"
                        id="sender_name"
                        value={formData.sender_name}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="sender_email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        name="sender_email"
                        id="sender_email"
                        value={formData.sender_email}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="sender_phone" className="block text-sm font-medium text-gray-700">
                      Téléphone
                    </label>
                    <div className="mt-1">
                      <input
                        type="tel"
                        name="sender_phone"
                        id="sender_phone"
                        value={formData.sender_phone}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="sender_address" className="block text-sm font-medium text-gray-700">
                      Adresse
                    </label>
                    <div className="mt-1">
                      <textarea
                        name="sender_address"
                        id="sender_address"
                        rows={3}
                        value={formData.sender_address}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations sur le destinataire */}
              <div className="sm:col-span-2 lg:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Informations destinataire</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="recipient_name" className="block text-sm font-medium text-gray-700">
                      Nom complet
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="recipient_name"
                        id="recipient_name"
                        value={formData.recipient_name}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="recipient_email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        name="recipient_email"
                        id="recipient_email"
                        value={formData.recipient_email}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="recipient_phone" className="block text-sm font-medium text-gray-700">
                      Téléphone
                    </label>
                    <div className="mt-1">
                      <input
                        type="tel"
                        name="recipient_phone"
                        id="recipient_phone"
                        value={formData.recipient_phone}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="recipient_address" className="block text-sm font-medium text-gray-700">
                      Adresse
                    </label>
                    <div className="mt-1">
                      <textarea
                        name="recipient_address"
                        id="recipient_address"
                        rows={3}
                        value={formData.recipient_address}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations sur le colis */}
              <div className="sm:col-span-2 lg:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Informations colis</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                      Poids (kg)
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        step="0.01"
                        name="weight"
                        id="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="dimensions" className="block text-sm font-medium text-gray-700">
                      Dimensions (cm)
                    </label>
                    <div className="mt-1 grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        name="length"
                        placeholder="Longueur"
                        value={formData.length}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      />
                      <input
                        type="number"
                        name="width"
                        placeholder="Largeur"
                        value={formData.width}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      />
                      <input
                        type="number"
                        name="height"
                        placeholder="Hauteur"
                        value={formData.height}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                      Valeur déclarée (€)
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        step="0.01"
                        name="value"
                        id="value"
                        value={formData.value}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <div className="mt-1">
                      <textarea
                        name="description"
                        id="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Création...' : 'Créer le colis'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
}
