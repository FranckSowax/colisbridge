import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { supabase } from '../config/supabaseClient';

export default function EditParcelModal({ isOpen, onClose, parcel, onSuccess }) {
  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_phone: '',
    recipient_email: '',
    recipient_address: '',
    weight: '',
    shipping_type: '',
    special_instructions: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (parcel) {
      setFormData({
        recipient_name: parcel.recipient_name || '',
        recipient_phone: parcel.recipient_phone || '',
        recipient_email: parcel.recipient_email || '',
        recipient_address: parcel.recipient_address || '',
        weight: parcel.weight || '',
        shipping_type: parcel.shipping_type || '',
        special_instructions: parcel.special_instructions || ''
      });
    }
  }, [parcel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('parcels')
        .update({
          recipient_name: formData.recipient_name,
          recipient_phone: formData.recipient_phone,
          recipient_email: formData.recipient_email,
          recipient_address: formData.recipient_address,
          weight: parseFloat(formData.weight),
          shipping_type: formData.shipping_type,
          special_instructions: formData.special_instructions
        })
        .eq('id', parcel.id);

      if (error) throw error;

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
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fermer</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Modifier le colis
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                        <label htmlFor="special_instructions" className="block text-sm font-medium text-gray-700">
                          Instructions spéciales
                        </label>
                        <textarea
                          name="special_instructions"
                          id="special_instructions"
                          value={formData.special_instructions}
                          onChange={handleChange}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={isSubmitting}
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
