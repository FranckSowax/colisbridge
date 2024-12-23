import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { PhotoIcon, PlusIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { useCreateParcel } from '../hooks/useCreateParcel';
import { useRecipients } from '../hooks/useRecipients';
import { useCreateRecipient } from '../hooks/useCreateRecipient';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

const SHIPPING_TYPES = [
  { id: 'standard', name: 'Standard' },
  { id: 'express', name: 'Express' },
  { id: 'maritime', name: 'Maritime' }
];

const COUNTRIES = [
  { id: 'france', name: 'France' },
  { id: 'gabon', name: 'Gabon' },
  { id: 'togo', name: 'Togo' },
  { id: 'cote_ivoire', name: "Côte d'Ivoire" },
  { id: 'dubai', name: 'Dubaï' }
];

export default function NewParcelForm({ isOpen, onClose }) {
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

  const filteredRecipients = query === ''
    ? recipients || []
    : (recipients || []).filter((recipient) => {
        return recipient.name.toLowerCase().includes(query.toLowerCase()) ||
               recipient.phone.includes(query);
      });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      toast.error('Vous ne pouvez pas ajouter plus de 5 photos');
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
      toast.error('Le volume CBM est obligatoire pour un envoi maritime');
      return false;
    }
    if (['standard', 'express'].includes(formData.shipping_type) && !formData.weight) {
      toast.error('Le poids est obligatoire pour un envoi standard ou express');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      let recipientId = formData.recipient_id;

      if (isNewRecipient) {
        const newRecipientData = await createRecipientMutation.mutateAsync({
          name: newRecipient.name,
          email: newRecipient.email,
          phone: newRecipient.phone,
          address: newRecipient.address
        });
        
        if (!newRecipientData?.id) {
          throw new Error('Erreur lors de la création du destinataire');
        }
        
        recipientId = newRecipientData.id;
      } else if (!recipientId || recipientId === 'new') {
        throw new Error('Veuillez sélectionner un destinataire');
      }

      const parcelData = {
        ...formData,
        recipient_id: recipientId
      };

      await createParcelMutation.mutateAsync(parcelData);
      toast.success('Colis créé avec succès');
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <Dialog.Panel className="mx-auto w-full max-w-2xl bg-white rounded-xl shadow-lg sm:w-11/12 md:w-3/4 lg:w-2/3">
          <div className="p-4 sm:p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Nouveau colis
            </Dialog.Title>
            <p className="mt-1 text-sm text-gray-500">
              Remplissez les informations pour créer un nouveau colis
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
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
                      Destinataire
                    </Combobox.Label>
                    <div className="relative mt-1">
                      <Combobox.Input
                        className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                        onChange={(event) => setQuery(event.target.value)}
                        displayValue={(id) => {
                          if (id === 'new') return 'Nouveau destinataire';
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
                                <span>Nouveau destinataire</span>
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
                    <h3 className="text-sm font-medium text-gray-900">Nouveau destinataire</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Nom complet
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
                          Téléphone
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
                          Email
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
                          Adresse
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

              {/* Pays et Type d'envoi */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Pays de destination
                  </label>
                  <select
                    id="country"
                    name="country"
                    required
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

                <div>
                  <label htmlFor="shipping_type" className="block text-sm font-medium text-gray-700">
                    Type d'envoi
                  </label>
                  <select
                    id="shipping_type"
                    name="shipping_type"
                    required
                    value={formData.shipping_type}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {SHIPPING_TYPES.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Poids et CBM */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {['standard', 'express'].includes(formData.shipping_type) && (
                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                      Poids (kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      id="weight"
                      name="weight"
                      required
                      value={formData.weight}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                )}

                {formData.shipping_type === 'maritime' && (
                  <div>
                    <label htmlFor="cbm" className="block text-sm font-medium text-gray-700">
                      Volume CBM (m³)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      id="cbm"
                      name="cbm"
                      required
                      value={formData.cbm}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Instructions spéciales */}
              <div>
                <label htmlFor="special_instructions" className="block text-sm font-medium text-gray-700">
                  Instructions spéciales
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
                  Photos ({photoPreview.length}/5)
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
                  Vous pouvez ajouter jusqu'à 5 photos.
                </p>
              </div>

              {/* Boutons */}
              <div className="flex justify-end space-x-3">
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
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
