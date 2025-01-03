import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PhotoIcon, PlusIcon } from '@heroicons/react/24/solid';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Combobox } from '@headlessui/react';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { useCreateParcel } from '../hooks/useCreateParcel';
import { useRecipients } from '../hooks/useRecipients';
import { useCreateRecipient } from '../hooks/useCreateRecipient';
import { useCalculatePrice } from '../hooks/useCalculatePrice';
import { notificationService } from '../services/notificationService';

const SHIPPING_TYPES = [
  { id: 'standard', name: 'standard' },
  { id: 'express', name: 'express' },
  { id: 'maritime', name: 'maritime' }
];

const COUNTRIES = [
  { id: 'france', name: 'France' },
  { id: 'gabon', name: 'Gabon' },
  { id: 'togo', name: 'Togo' },
  { id: 'cote_ivoire', name: "Côte d'Ivoire" },
  { id: 'dubai', name: 'Dubaï' }
];

export default function NewParcelForm({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    recipient_id: '',
    country: 'france',
    shipping_type: 'standard',
    weight: '',
    cbm: '',
    special_instructions: '',
    photos: []
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
  
  const { data: recipients, isLoading: recipientsLoading } = useRecipients();
  const createParcelMutation = useCreateParcel();
  const createRecipientMutation = useCreateRecipient();
  const { data: priceData, isLoading: isPriceLoading } = useCalculatePrice({
    country: formData.country,
    shippingType: formData.shipping_type,
    weight: parseFloat(formData.weight) || null,
    cbm: parseFloat(formData.cbm) || null
  });

  const displayPrice = () => {
    if (isPriceLoading) return t('parcels.form.shipping.calculating');
    if (!priceData) return '-';
    return priceData.formatted;
  };

  const filteredRecipients = query === ''
    ? recipients || []
    : (recipients || []).filter((recipient) => {
        return recipient.name.toLowerCase().includes(query.toLowerCase()) ||
               recipient.phone.includes(query);
      });

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (['country', 'shipping_type', 'weight', 'cbm'].includes(name)) {
      const newFormData = {
        ...formData,
        [name]: value
      };

      const price = await priceData.refetch({
        country: newFormData.country,
        shippingType: newFormData.shipping_type,
        weight: newFormData.weight ? parseFloat(newFormData.weight) : null,
        cbm: newFormData.cbm ? parseFloat(newFormData.cbm) : null
      });
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
    if (formData.shipping_type === 'maritime' && !formData.cbm) {
      toast.error(t('parcels.form.errors.cbmRequired'));
      return false;
    }
    if (['standard', 'express'].includes(formData.shipping_type) && !formData.weight) {
      toast.error(t('parcels.form.errors.weightRequired'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!priceData || !priceData.total) {
        toast.error(t('parcels.form.errors.priceCalculation'));
        return;
      }

      if (!validateForm()) return;

      let recipientId = formData.recipient_id;

      if (isNewRecipient) {
        const newRecipientData = await createRecipientMutation.mutateAsync({
          name: newRecipient.name,
          email: newRecipient.email,
          phone: newRecipient.phone,
          address: newRecipient.address
        });
        
        if (!newRecipientData?.id) {
          throw new Error(t('parcels.form.errors.recipientCreation'));
        }
        
        recipientId = newRecipientData.id;
      } else if (!recipientId || recipientId === 'new') {
        throw new Error(t('parcels.form.errors.recipientSelection'));
      }

      const parcelData = {
        ...formData,
        recipient_id: recipientId,
        total_price: priceData.total,
        currency: priceData.currency,
        status: 'reçu'
      };

      const data = await createParcelMutation.mutateAsync(parcelData);
      
      if (data) {
        // Créer une notification pour le nouveau colis
        await notificationService.notifyParcelCreated(
          1, // user.id
          data.id,
          data.tracking_number
        );
        
        toast.success(t('parcels.form.success'));
        onClose();
      }
    } catch (error) {
      console.error(t('parcels.form.errors.parcelCreation'), error);
      toast.error(t('parcels.form.errors.parcelCreation'));
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-t-xl sm:rounded-lg bg-white w-full sm:max-w-lg transition-all">
                {/* Header */}
                <div className="border-b border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      {t('parcels.form.title')}
                    </Dialog.Title>
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={onClose}
                    >
                      <span className="sr-only">{t('parcels.form.close')}</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Destinataire */}
                  <div className="space-y-4">
                    <div className="relative">
                      <Combobox
                        as="div"
                        value={formData.recipient_id}
                        onChange={(value) => {
                          if (value === 'new') {
                            setIsNewRecipient(true);
                          } else {
                            setIsNewRecipient(false);
                            setFormData(prev => ({ ...prev, recipient_id: value }));
                          }
                        }}
                      >
                        <Combobox.Label className="block text-sm font-medium text-gray-700">
                          {t('parcels.form.recipient')}
                        </Combobox.Label>
                        <div className="relative mt-1">
                          <Combobox.Input
                            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                            onChange={(event) => setQuery(event.target.value)}
                            displayValue={(id) => {
                              if (id === 'new') return t('parcels.form.newRecipient');
                              const recipient = recipients?.find(r => r.id === id);
                              return recipient ? `${recipient.name} (${recipient.phone})` : '';
                            }}
                          />
                          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </Combobox.Button>

                          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            <Combobox.Option
                              value="new"
                              className={({ active }) =>
                                `relative cursor-default select-none py-2 pl-3 pr-9 ${
                                  active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                }`
                              }
                            >
                              {({ active, selected }) => (
                                <>
                                  <div className="flex items-center">
                                    <PlusIcon className="h-5 w-5 mr-2" />
                                    <span>{t('parcels.form.newRecipient')}</span>
                                  </div>
                                  {selected && (
                                    <span className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                      active ? 'text-white' : 'text-indigo-600'
                                    }`}>
                                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                  )}
                                </>
                              )}
                            </Combobox.Option>
                            {filteredRecipients.map((recipient) => (
                              <Combobox.Option
                                key={recipient.id}
                                value={recipient.id}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-3 pr-9 ${
                                    active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                  }`
                                }
                              >
                                {({ active, selected }) => (
                                  <>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{recipient.name}</span>
                                      <span className="text-sm text-gray-500">{recipient.phone}</span>
                                    </div>
                                    {selected && (
                                      <span className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                        active ? 'text-white' : 'text-indigo-600'
                                      }`}>
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </Combobox.Option>
                            ))}
                          </Combobox.Options>
                        </div>
                      </Combobox>
                    </div>

                    {isNewRecipient && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                        <h3 className="text-sm font-medium text-gray-900">{t('parcels.form.newRecipient')}</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                              {t('parcels.form.recipientName')}
                            </label>
                            <input
                              type="text"
                              name="name"
                              id="name"
                              required
                              value={newRecipient.name}
                              onChange={handleNewRecipientChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                              {t('parcels.form.recipientPhone')}
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              id="phone"
                              required
                              value={newRecipient.phone}
                              onChange={handleNewRecipientChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                              {t('parcels.form.recipientEmail')}
                            </label>
                            <input
                              type="email"
                              name="email"
                              id="email"
                              value={newRecipient.email}
                              onChange={handleNewRecipientChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                              {t('parcels.form.recipientAddress')}
                            </label>
                            <textarea
                              name="address"
                              id="address"
                              required
                              rows={3}
                              value={newRecipient.address}
                              onChange={handleNewRecipientChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Informations d'expédition */}
                  <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
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
                        {SHIPPING_TYPES.map(type => (
                          <option key={type.id} value={type.id}>
                            {t(`parcels.form.shippingTypes.${type.name}`)}
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
                        {COUNTRIES.map(country => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.shipping_type !== 'maritime' ? (
                      <div>
                        <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                          {t('parcels.form.weight')}
                        </label>
                        <input
                          type="number"
                          name="weight"
                          id="weight"
                          step="0.1"
                          min="0"
                          value={formData.weight}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    ) : (
                      <div>
                        <label htmlFor="cbm" className="block text-sm font-medium text-gray-700">
                          {t('parcels.form.cbm')}
                        </label>
                        <input
                          type="number"
                          name="cbm"
                          id="cbm"
                          step="0.1"
                          min="0"
                          value={formData.cbm}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t('parcels.form.price')}
                      </label>
                      <div className="mt-1 flex items-center">
                        <span className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 sm:text-sm">
                          {displayPrice()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Instructions spéciales */}
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

                  {/* Photos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('parcels.form.photos')} ({photoPreview.length}/5)
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {photoPreview.map((photo, index) => (
                        <div key={index} className="relative aspect-square">
                          <img
                            src={photo.preview}
                            alt={`Preview ${index + 1}`}
                            className="h-full w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white p-1 text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {photoPreview.length < 5 && (
                        <div className="aspect-square border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center">
                          <label className="cursor-pointer w-full h-full flex items-center justify-center">
                            <PhotoIcon className="h-8 w-8 text-gray-400" />
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handlePhotoChange}
                              className="sr-only"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {t('parcels.form.photosLimit')}
                    </p>
                  </div>

                  {/* Boutons */}
                  <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row-reverse gap-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full sm:w-auto flex-1 justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isLoading ? t('parcels.form.loading') : t('parcels.form.submit')}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-auto flex-1 justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      {t('parcels.form.cancel')}
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
