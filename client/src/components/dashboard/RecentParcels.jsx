import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLanguage } from '@contexts/LanguageContext';
import { useRecentParcels } from '@/hooks/useRecentParcels';

const statusStyles = {
  receptionne: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200',
  expedie: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-200',
  recu: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-200',
  litige: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200',
};

const tableClasses = "min-w-full divide-y divide-gray-200 bg-white text-gray-800";
const headerClasses = "bg-white text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
const cellClasses = "whitespace-nowrap text-sm text-gray-800";

export function RecentParcels() {
  const [currentPage, setCurrentPage] = useState(1);
  const { parcels, loading, error, hasMore } = useRecentParcels(currentPage);
  const { t } = useLanguage();

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const columns = useMemo(() => [
    { key: 'tracking_number', label: 'Numéro de suivi' },
    { key: 'created_at', label: 'Date de création' },
    { key: 'recipient_name', label: 'Destinataire' },
    { key: 'country', label: 'Destination' },
    { key: 'weight', label: 'Poids / Volume' },
    { key: 'status', label: 'Statut' }
  ], []);

  const getStatusDisplay = (status) => {
    const statusMap = {
      'receptionne': 'Reçu',
      'expedie': 'Expédié',
      'recu': 'Reçu',
      'litige': 'En litige'
    };
    return statusMap[status] || status;
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

  const formatWeight = (weight) => {
    if (!weight) return '-';
    return `${weight} kg`;
  };

  if (loading) {
    return (
      <div className="mt-4 text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
        <p className="text-gray-500 dark:text-gray-400">
          Chargement...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
        <p className="text-red-500 dark:text-red-400">
          Une erreur est survenue lors du chargement des colis
        </p>
      </div>
    );
  }

  if (!parcels?.length) {
    return (
      <div className="mt-4 text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
        <p className="text-gray-500 dark:text-gray-400">
          Aucun colis à afficher
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {t('dashboard.recentParcels')}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className={tableClasses}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`${headerClasses} px-6 py-3`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {parcels.map((parcel) => (
              <tr key={parcel.id} className="hover:bg-gray-50">
                <td className={`${cellClasses} px-6 py-4`}>
                  {parcel.tracking_number}
                </td>
                <td className={`${cellClasses} px-6 py-4`}>
                  {format(new Date(parcel.created_at), 'dd/MM/yyyy')}
                </td>
                <td className={`${cellClasses} px-6 py-4`}>
                  {parcel.recipient_name || '-'}
                </td>
                <td className={`${cellClasses} px-6 py-4`}>
                  {getCountryName(parcel.country)}
                </td>
                <td className={`${cellClasses} px-6 py-4`}>
                  {formatWeight(parcel.weight)}
                </td>
                <td className={`${cellClasses} px-6 py-4`}>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[parcel.status]}`}>
                    {getStatusDisplay(parcel.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          Précédent
        </button>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!hasMore}
          className="relative inline-flex items-center rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
