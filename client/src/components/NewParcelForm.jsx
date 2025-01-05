import React, { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PhotoIcon, PlusIcon } from '@heroicons/react/24/solid';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Combobox } from '@headlessui/react';
import toast from 'react-hot-toast';
import { useLanguage } from '@contexts/LanguageContext';
import { useCreateParcel } from '../hooks/useCreateParcel';
import { useRecipients } from '../hooks/useRecipients';
import { useCreateRecipient } from '../hooks/useCreateRecipient';
import { useCalculatePrice } from '../hooks/useCalculatePrice';
import { notificationService } from '../services/notificationService';
import { useAuth } from '@contexts/AuthContext';
import { photoService } from '../services/photoService';
import PhotoUpload from './PhotoUpload';

const SHIPPING_TYPES = [
  { id: 'Standard', name: 'parcels.form.shippingType.standard' },
  { id: 'Express', name: 'parcels.form.shippingType.express' },
  { id: 'Maritime', name: 'parcels.form.shippingType.maritime' }
];

const COUNTRIES = [
  { id: 'france', name: 'parcels.form.country.france' },
  { id: 'gabon', name: 'parcels.form.country.gabon' },
  { id: 'togo', name: 'parcels.form.country.togo' },
  { id: 'cote_ivoire', name: 'parcels.form.country.cote_ivoire' },
  { id: 'dubai', name: 'parcels.form.country.dubai' }
];

const NewParcelForm = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { t, loading: langLoading } = useLanguage();
  
  // Si le contexte de langue n'est pas encore chargé, on affiche un loader
  if (langLoading) {
    return (
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={onClose}
        open={isOpen}
      >
        <div className="flex min-h-screen items-center justify-center">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          <div className="relative bg-white p-8 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </Dialog>
    );
  }

  // Vérifier si l'utilisateur est connecté
  if (!user) {
    toast.error(t('auth.errors.notAuthenticated'));
    onClose();
    return null;
  }

  const [formData, setFormData] = useState({
    recipient_id: '',
    recipient_name: '',
    recipient_phone: '',
    recipient_email: '',
    recipient_address: '',
    country: 'france',
    city: '',
    postal_code: '',
    shipping_type: 'Standard',
    weight: '',
    dimensions: '',
    special_instructions: '',
    photos: [],
    client_id: null,
    client_reference: null
  });

  const [query, setQuery] = useState('');
  const [isNewRecipient, setIsNewRecipient] = useState(false);
  const [newRecipient, setNewRecipient] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  
  const [photoPreview, setPhotoPreview] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  
  const { data: recipients, isLoading: recipientsLoading } = useRecipients();
  const createParcelMutation = useCreateParcel();
  const createRecipientMutation = useCreateRecipient();
  const { data: priceData, refetch: refetchPrice } = useCalculatePrice({
    country: formData.country,
    shippingType: formData.shipping_type,
    weight: formData.weight ? parseFloat(formData.weight) : null,
    cbm: formData.cbm ? parseFloat(formData.cbm) : null
  });

  const displayPrice = () => {
    if (priceData === undefined) return t('parcels.form.shipping.calculating');
    if (!priceData) return '-';
    return priceData.formatted;
  };

  const filteredRecipients = query === ''
    ? recipients || []
    : (recipients || []).filter((recipient) => {
        return recipient.name.toLowerCase().includes(query.toLowerCase()) ||
               recipient.phone.includes(query);
      });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        recipient_id: '',
        recipient_name: '',
        recipient_phone: '',
        recipient_email: '',
        recipient_address: '',
        country: 'france',
        city: '',
        postal_code: '',
        shipping_type: 'Standard',
        weight: '',
        dimensions: '',
        special_instructions: '',
        photos: [],
        client_id: null,
        client_reference: null
      });
      setQuery('');
      setIsNewRecipient(false);
      setNewRecipient({
        name: '',
        email: '',
        phone: '',
        address: ''
      });
      setPhotoPreview([]);
      setPhotos([]);
    }
  }, [isOpen]);

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prevData => {
      const newData = {
        ...prevData,
        [name]: value
      };
      
      // Si c'est un champ du destinataire, mettre à jour également les champs correspondants
      if (name === 'recipient_name' || name === 'recipient_email' || name === 'recipient_phone' || name === 'recipient_address') {
        setNewRecipient(prev => ({
          ...prev,
          [name.replace('recipient_', '')]: value
        }));
      }
      
      return newData;
    });

    if (['country', 'shipping_type', 'weight', 'cbm'].includes(name)) {
      await refetchPrice();
    }
  };

  const handleNewRecipientChange = (e) => {
    const { name, value } = e.target;
    setNewRecipient(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + photoPreview.length > 5) {
      toast.error(t('parcels.form.errors.photoLimit'));
      return;
    }

    const newFiles = files.slice(0, 5 - photoPreview.length);
    const newPreviews = newFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setPhotoPreview(prev => [...prev, ...newPreviews]);
    setFormData(prev => ({
      ...prev,
      photos: [...(prev.photos || []), ...newFiles]
    }));
  };

  const removePhoto = (index) => {
    setPhotoPreview(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].preview);
      newPreviews.splice(index, 1);
      return newPreviews;
    });

    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    // Validation du poids selon le type d'expédition
    if (formData.shipping_type === 'Maritime' && !formData.cbm) {
      toast.error(t('parcels.form.errors.cbmRequired'));
      return false;
    }
    if (['Standard', 'Express'].includes(formData.shipping_type) && !formData.weight) {
      toast.error(t('parcels.form.errors.weightRequired'));
      return false;
    }

    // Validation des informations du destinataire
    if (!formData.recipient_name || !formData.recipient_phone) {
      toast.error(t('parcels.form.errors.recipientRequired'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Vérifier à nouveau l'authentification
      if (!user) {
        toast.error(t('auth.errors.notAuthenticated'));
        return;
      }

      if (!priceData || !priceData.total) {
        toast.error(t('parcels.form.errors.priceCalculation'));
        return;
      }

      if (!validateForm()) return;

      // Préparer les données du destinataire
      const parcelData = {
        ...formData,
        shipping_type: formData.shipping_type,
        special_instructions: formData.special_instructions || null,
        dimensions: formData.dimensions || null,
        weight: formData.weight ? Number(formData.weight) : 0,
        // Pour un nouveau destinataire, recipient_id sera null
        recipient_id: formData.recipient_id === 'new' ? null : formData.recipient_id,
        // Ajouter l'ID de l'utilisateur
        created_by: user.id
      };

      const data = await createParcelMutation.mutateAsync(parcelData);
      
      if (data && data[0]) {  
        // Télécharger les photos
        if (photos.length > 0) {
          const uploadPromises = photos.map(photo => 
            photoService.uploadParcelPhoto(photo, data[0].parcel_id)
          );
          await Promise.all(uploadPromises);
        }

        // Créer une notification pour le nouveau colis
        await notificationService.notifyParcelCreated(
          user.id,
          data[0].parcel_id,
          data[0].tracking_number
        );
        
        toast.success(t('parcels.form.success'));
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error creating parcel:', error);
      if (error.message === 'Vous devez être connecté pour créer un colis') {
        toast.error(t('auth.errors.notAuthenticated'));
      } else {
        toast.error(t('parcels.form.errors.parcelCreation'));
      }
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={onClose}>
        <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 sm:align-middle">
              <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={onClose}
                >
                  <span className="sr-only">{t('actions.close')}</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                    {t('parcels.form.title')}
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {t('parcels.form.recipient.search')}
                      </label>
                      <Combobox
                        as="div"
                        value={formData.recipient_id}
                        onChange={(recipientId) => {
                          if (recipientId === 'new') {
                            setIsNewRecipient(true);
                            setFormData(prev => ({
                              ...prev,
                              recipient_id: recipientId,
                              recipient_name: '',
                              recipient_email: '',
                              recipient_phone: '',
                              recipient_address: ''
                            }));
                          } else {
                            const selectedRecipient = recipients.find(r => r.id === recipientId);
                            setIsNewRecipient(false);
                            if (selectedRecipient) {
                              setFormData(prev => ({
                                ...prev,
                                recipient_id: recipientId,
                                recipient_name: selectedRecipient.name,
                                recipient_email: selectedRecipient.email,
                                recipient_phone: selectedRecipient.phone,
                                recipient_address: selectedRecipient.address
                              }));
                            }
                          }
                        }}
                      >
                        <div className="relative mt-1">
                          <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                            <Combobox.Input
                              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                              placeholder={t('parcels.form.recipient.search')}
                              onChange={(event) => setQuery(event.target.value)}
                            />
                            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                            </Combobox.Button>
                          </div>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                            afterLeave={() => setQuery('')}
                          >
                            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              <Combobox.Option
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-teal-600 text-white' : 'text-gray-900'
                                  }`
                                }
                                value="new"
                              >
                                {t('parcels.form.recipient.new')}
                              </Combobox.Option>
                            </Combobox.Options>
                          </Transition>
                        </div>
                      </Combobox>
                    </div>

                    <div className="space-y-4">
                      <div className="mt-4">
                        <label
                          htmlFor="recipient_name"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Nom du destinataire
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="recipient_name"
                            id="recipient_name"
                            required
                            value={formData.recipient_name}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label
                          htmlFor="recipient_email"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Email
                        </label>
                        <div className="mt-1">
                          <input
                            type="email"
                            name="recipient_email"
                            id="recipient_email"
                            value={formData.recipient_email}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label
                          htmlFor="recipient_phone"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Téléphone
                        </label>
                        <div className="mt-1">
                          <input
                            type="tel"
                            name="recipient_phone"
                            id="recipient_phone"
                            required
                            value={formData.recipient_phone}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label
                          htmlFor="recipient_address"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Adresse
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="recipient_address"
                            id="recipient_address"
                            required
                            value={formData.recipient_address}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="shipping_type" className="block text-sm font-medium text-gray-700">
                          {t('parcels.form.shippingType')}
                        </label>
                        <select
                          id="shipping_type"
                          name="shipping_type"
                          value={formData.shipping_type}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          {SHIPPING_TYPES.map((type) => (
                            <option key={type.id} value={type.id}>
                              {t(type.name)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                          {t('parcels.form.country')}
                        </label>
                        <select
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          {COUNTRIES.map((country) => (
                            <option key={country.id} value={country.id}>
                              {t(country.name)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                          {t('parcels.form.city')}
                        </label>
                        <input
                          type="text"
                          name="city"
                          id="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                          {t('parcels.form.postalCode')}
                        </label>
                        <input
                          type="text"
                          name="postal_code"
                          id="postal_code"
                          value={formData.postal_code}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                          {t('parcels.form.weight')}
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
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                          {t('parcels.form.price')}
                        </label>
                        <input
                          type="text"
                          name="price"
                          id="price"
                          value={displayPrice()}
                          readOnly
                          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="special_instructions" className="block text-sm font-medium text-gray-700">
                        {t('parcels.form.specialInstructions')}
                      </label>
                      <textarea
                        id="special_instructions"
                        name="special_instructions"
                        rows={3}
                        value={formData.special_instructions}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t('parcels.form.photos.label')}
                      </label>
                      <PhotoUpload photos={photos} onChange={setPhotos} />
                    </div>

                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                            {t('loading.submitting')}
                          </div>
                        ) : (
                          t('parcels.form.submit')
                        )}
                      </button>
                      <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                        onClick={onClose}
                      >
                        {t('parcels.form.cancel')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default NewParcelForm;
