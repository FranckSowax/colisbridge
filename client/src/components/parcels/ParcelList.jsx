import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabaseConfig';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function ParcelList() {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const getStatusColor = (status) => {
    const colors = {
      'reçu': 'bg-blue-100 text-blue-800',
      'expédié': 'bg-purple-100 text-purple-800',
      'en_livraison': 'bg-yellow-100 text-yellow-800',
      'livré': 'bg-green-100 text-green-800',
      'en_litige': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
        Une erreur est survenue lors du chargement des colis.
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Liste des colis</h1>
            <p className="mt-2 text-sm text-gray-700">
              Liste de tous les colis avec leurs détails et statuts.
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
                      Référence
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Expéditeur
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Destinataire
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Statut
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
                        {parcel.recipient_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {format(new Date(parcel.created_at), 'dd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(parcel.status)}`}>
                          {parcel.status}
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
    </div>
  );
}
