import { useState, useEffect } from 'react';
import NewParcelForm from '../../components/NewParcelForm';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

export default function CreateParcel() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [parcels, setParcels] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Charger les colis initiaux
    const fetchParcels = async () => {
      const { data, error } = await supabase
        .from('parcels')
        .select(`
          *,
          recipient:recipients (
            id,
            name,
            phone,
            email
          )
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des colis:', error);
        toast.error('Erreur lors du chargement des colis');
        return;
      }

      console.log('Colis chargés:', data);
      setParcels(data);
    };

    if (user) {
      fetchParcels();

      // Souscrire aux changements en temps réel
      const parcelSubscription = supabase
        .channel('parcels_channel')
        .on('postgres_changes', 
          {
            event: '*',
            schema: 'public',
            table: 'parcels',
            filter: `created_by=eq.${user.id}`
          }, 
          (payload) => {
            console.log('Changement détecté:', payload);
            fetchParcels(); // Recharger les colis après chaque changement
          }
        )
        .subscribe();

      // Nettoyage
      return () => {
        parcelSubscription.unsubscribe();
      };
    }
  }, [user]);

  const handleClose = () => {
    setIsModalOpen(false);
    navigate('/dashboard');
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    navigate('/dashboard');
  };

  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Liste des colis</h2>
        <p className="mt-2 text-sm text-gray-700">
          Liste de tous vos colis avec leurs détails et statuts
        </p>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Numéro de suivi
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Destinataire
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date de création
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Poids (kg)
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date d'envoi
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Statut
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {parcels.map((parcel) => (
                    <tr key={parcel.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {parcel.tracking_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {parcel.recipient?.name || parcel.recipient_name || '-'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {parcel.recipient?.phone || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatDate(parcel.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {parcel.weight || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {parcel.shipped_at ? formatDate(parcel.shipped_at) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <select
                          value={parcel.status}
                          onChange={async (e) => {
                            const { error } = await supabase
                              .from('parcels')
                              .update({ status: e.target.value })
                              .eq('id', parcel.id);
                            if (error) {
                              console.error('Erreur lors de la mise à jour du statut:', error);
                              toast.error('Erreur lors de la mise à jour du statut');
                            }
                          }}
                          className="rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        >
                          <option value="recu">Reçu</option>
                          <option value="expedie">Expédié</option>
                          <option value="receptionne">Réceptionné</option>
                          <option value="termine">Terminé</option>
                          <option value="litige">Litige</option>
                        </select>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => navigate(`/dashboard/parcels/${parcel.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Voir les détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <NewParcelForm 
        isOpen={isModalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        parcels={parcels}
      />
    </div>
  );
}