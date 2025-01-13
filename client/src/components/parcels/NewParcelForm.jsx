import { useState } from 'react';
import { supabase } from '@/config/supabaseConfig';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function NewParcelForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reference: '',
    sender_name: '',
    destinataire: '',
    pays: '',
    type_envoi: 'Standard',
    poids: '',
    prix: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('parcels')
        .insert([{
          ...formData,
          status: 'reçu',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast.success('Colis créé avec succès');
      navigate('/dashboard'); // Retour au tableau de bord
    } catch (error) {
      console.error('Error creating parcel:', error);
      toast.error('Erreur lors de la création du colis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Nouveau Colis</h3>
          <p className="mt-1 text-sm text-gray-600">
            Remplissez les informations pour créer un nouveau colis.
          </p>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="reference" className="block text-sm font-medium text-gray-700">
                      Numéro de référence
                    </label>
                    <input
                      type="text"
                      name="reference"
                      id="reference"
                      required
                      value={formData.reference}
                      onChange={handleChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="sender_name" className="block text-sm font-medium text-gray-700">
                      Expéditeur
                    </label>
                    <input
                      type="text"
                      name="sender_name"
                      id="sender_name"
                      required
                      value={formData.sender_name}
                      onChange={handleChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="destinataire" className="block text-sm font-medium text-gray-700">
                      Destinataire
                    </label>
                    <input
                      type="text"
                      name="destinataire"
                      id="destinataire"
                      required
                      value={formData.destinataire}
                      onChange={handleChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="pays" className="block text-sm font-medium text-gray-700">
                      Pays
                    </label>
                    <input
                      type="text"
                      name="pays"
                      id="pays"
                      required
                      value={formData.pays}
                      onChange={handleChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="type_envoi" className="block text-sm font-medium text-gray-700">
                      Type d'envoi
                    </label>
                    <select
                      name="type_envoi"
                      id="type_envoi"
                      required
                      value={formData.type_envoi}
                      onChange={handleChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Express">Express</option>
                    </select>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="poids" className="block text-sm font-medium text-gray-700">
                      Poids (kg)
                    </label>
                    <input
                      type="number"
                      name="poids"
                      id="poids"
                      required
                      value={formData.poids}
                      onChange={handleChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="prix" className="block text-sm font-medium text-gray-700">
                      Prix (FCFA)
                    </label>
                    <input
                      type="number"
                      name="prix"
                      id="prix"
                      required
                      value={formData.prix}
                      onChange={handleChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {loading ? 'Création...' : 'Créer le colis'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
