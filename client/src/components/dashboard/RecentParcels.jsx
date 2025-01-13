import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLanguage } from '@contexts/LanguageContext';
import { useRecentParcels } from '@/hooks/useRecentParcels';

const statusStyles = {
  received: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200',
  shipped: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-200',
  completed: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-200',
  disputed: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200',
};

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
      'received': 'Reçu',
      'shipped': 'Expédié',
      'completed': 'Terminé',
      'disputed': 'En litige'
    };
    return statusMap[status] || status;
  };

  const getCountryFlag = (countryCode) => {
    // Convertir le code pays en emojis de drapeau
    // Les codes pays sont composés de deux lettres majuscules
    // Pour obtenir l'emoji du drapeau, on convertit chaque lettre en emoji regional indicator
    if (!countryCode) return '';
    const base = 127397; // Point de code Unicode pour les regional indicators
    const flagEmoji = countryCode
      .toUpperCase()
      .split('')
      .map(char => String.fromCodePoint(base + char.charCodeAt(0)))
      .join('');
    return `${flagEmoji} ${countryCode}`;
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
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Colis récents
      </h2>
      
      <div className="mt-4 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-0"
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:bg-gray-900 dark:divide-gray-700">
                  {parcels.map((parcel) => (
                    <tr key={parcel.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-0">
                        {parcel.tracking_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(parcel.created_at), 'dd/MM/yyyy')}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {parcel.recipient_name || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {getCountryFlag(parcel.country)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatWeight(parcel.weight)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${statusStyles[parcel.status]}`}>
                          {getStatusDisplay(parcel.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
