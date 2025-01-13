import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabaseConfig';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline/index.js';
import { useLanguage } from '../../contexts/LanguageContext';

export function ParcelList() {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [disputeDescription, setDisputeDescription] = useState('');
  const [disputePriority, setDisputePriority] = useState('normale');
  const { t } = useLanguage();

  useEffect(() => {
    fetchParcels();
  }, []);

  async function fetchParcels() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parcels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setParcels(data);
    } catch (error) {
      console.error('Erreur lors du chargement des colis:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = (parcel, newStatus) => {
    if (newStatus === 'litige') {
      setSelectedParcel(parcel);
      setIsDisputeModalOpen(true);
    } else {
      updateParcelStatus(parcel.id, newStatus);
    }
  };

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Mettre à jour le statut du colis
      const parcelUpdate = {
        status: 'litige',
        updated_at: new Date().toISOString()
      };

      const { error: parcelError } = await supabase
        .from('parcels')
        .update(parcelUpdate)
        .eq('id', selectedParcel.id);

      if (parcelError) throw parcelError;

      // 2. Créer l'entrée dans la table litiges
      const { error: disputeError } = await supabase
        .from('litiges')
        .insert([{
          parcel_id: selectedParcel.id,
          description: disputeDescription,
          priority: disputePriority,
          status: 'ouvert',
          reference_colis: selectedParcel.reference,
          destinataire: selectedParcel.destinataire,
          pays: selectedParcel.pays,
          created_at: new Date().toISOString()
        }]);

      if (disputeError) throw disputeError;

      toast.success(t('parcels.disputeCreated'));
      setIsDisputeModalOpen(false);
      setDisputeDescription('');
      setDisputePriority('normale');
      fetchParcels();
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast.error(t('parcels.errorCreatingDispute'));
    }
  };

  const updateParcelStatus = async (parcelId, newStatus) => {
    try {
      const updates = {
        status: newStatus,
        ...(newStatus === 'litige' && {
          priority: 'normale',
          description: 'Nouveau litige créé',
          created_at: new Date().toISOString()
        })
      };

      const { error } = await supabase
        .from('parcels')
        .update(updates)
        .eq('id', parcelId);

      if (error) throw error;

      toast.success(t('parcels.statusUpdated', { status: newStatus }));
      fetchParcels();
    } catch (error) {
      console.error('Error updating parcel status:', error);
      toast.error(t('parcels.errorUpdatingStatus'));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'receptionne': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200',
      'expedie': 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-200',
      'recu': 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-200',
      'litige': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200'
    };
    return colors[status] || 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-200';
  };

  const getCountryFlag = (countryCode) => {
    if (!countryCode) return '';
    const base = 127397;
    const flagEmoji = countryCode
      .toUpperCase()
      .split('')
      .map(char => String.fromCodePoint(base + char.charCodeAt(0)))
      .join('');
    return flagEmoji;
  };

  const getCountryName = (countryCode) => {
    const countryNames = {
      'fr': 'FRANCE',
      'ga': 'GABON',
      'tg': 'TOGO',
      'ci': 'CÔTE D\'IVOIRE',
      'ae': 'ÉMIRATS ARABES UNIS'
    };
    return countryNames[countryCode?.toLowerCase()] || countryCode?.toUpperCase() || '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-4">
        {t('parcels.errorLoadingParcels')}
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">{t('parcels.title')}</h1>
            <p className="mt-2 text-sm text-gray-700">
              {t('parcels.description')}
            </p>
          </div>
        </div>
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                      {t('parcels.columns.reference')}
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      {t('parcels.columns.sender')}
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      {t('parcels.columns.recipient')}
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      {t('parcels.columns.destination')}
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      {t('parcels.columns.date')}
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      {t('parcels.columns.status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {parcels.map((parcel) => (
                    <tr key={parcel.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                        {parcel.reference}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {parcel.sender_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {parcel.destinataire}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-2">
                          <span className="text-lg">{getCountryFlag(parcel.country)}</span>
                          <span>{getCountryName(parcel.country)}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {format(new Date(parcel.created_at), 'dd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <select
                          value={parcel.status}
                          onChange={(e) => handleStatusChange(parcel, e.target.value)}
                          className={`rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(parcel.status)}`}
                        >
                          <option value="receptionne">{t('parcels.status.receptionne')}</option>
                          <option value="expedie">{t('parcels.status.expedie')}</option>
                          <option value="recu">{t('parcels.status.recu')}</option>
                          <option value="litige">{t('parcels.status.litige')}</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de création de litige */}
      <Dialog
        as="div"
        className="relative z-50"
        open={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-xl rounded-xl bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-medium">
                {t('parcels.disputeModal.title')}
              </Dialog.Title>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setIsDisputeModalOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-medium text-gray-700">{t('parcels.disputeModal.parcelInfo')}</h3>
              <div className="mt-2 text-sm text-gray-600">
                <p>{t('parcels.disputeModal.trackingNumber')}: {selectedParcel?.reference}</p>
                <p>{t('parcels.disputeModal.recipient')}: {selectedParcel?.destinataire}</p>
                <p>{t('parcels.disputeModal.country')}: {selectedParcel?.pays}</p>
              </div>
            </div>

            <form onSubmit={handleDisputeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('parcels.disputeModal.description')}
                </label>
                <textarea
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  rows={4}
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  placeholder={t('parcels.disputeModal.descriptionPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('parcels.disputeModal.priority')}
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={disputePriority}
                  onChange={(e) => setDisputePriority(e.target.value)}
                >
                  <option value="basse">{t('parcels.disputeModal.priorityLow')}</option>
                  <option value="normale">{t('parcels.disputeModal.priorityNormal')}</option>
                  <option value="haute">{t('parcels.disputeModal.priorityHigh')}</option>
                  <option value="urgente">{t('parcels.disputeModal.priorityUrgent')}</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={() => setIsDisputeModalOpen(false)}
                >
                  {t('parcels.disputeModal.cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {t('parcels.disputeModal.createDispute')}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
