import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { toast } from 'react-hot-toast';
import { UserCircleIcon } from '@heroicons/react/24/solid';

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    agency_role: '',
    agency_location: '',
    avatar_url: null
  });
  const [stats, setStats] = useState({
    total_parcels: 0,
    parcels_this_month: 0,
    total_clients: 0,
    active_clients: 0
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          ...data,
          email: user?.email || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch total parcels
      const { data: totalParcels } = await supabase
        .from('parcels')
        .select('id')
        .eq('created_by', user?.id);

      // Fetch parcels created this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data: monthParcels } = await supabase
        .from('parcels')
        .select('id')
        .eq('created_by', user?.id)
        .gte('created_at', startOfMonth.toISOString());

      // Fetch total clients
      const { data: totalClients } = await supabase
        .from('recipients')
        .select('id')
        .eq('created_by', user?.id);

      // Fetch active clients (with parcels in the last 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const { data: activeClients } = await supabase
        .from('recipients')
        .select('id')
        .eq('created_by', user?.id)
        .in('id', 
          supabase
            .from('parcels')
            .select('recipient_id')
            .eq('created_by', user?.id)
            .gte('created_at', threeMonthsAgo.toISOString())
        );

      setStats({
        total_parcels: totalParcels?.length || 0,
        parcels_this_month: monthParcels?.length || 0,
        total_clients: totalClients?.length || 0,
        active_clients: activeClients?.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const updates = {
        id: user?.id,
        full_name: profile.full_name,
        phone: profile.phone,
        agency_role: profile.agency_role,
        agency_location: profile.agency_location,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;
      toast.success('Profil mis à jour avec succès');
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* En-tête du profil */}
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Profil</h3>
              <p className="mt-1 text-sm text-gray-500">
                Informations de votre profil et statistiques
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="flex items-center space-x-5">
                <div className="flex-shrink-0">
                  {profile.avatar_url ? (
                    <img
                      className="h-16 w-16 rounded-full"
                      src={profile.avatar_url}
                      alt={profile.full_name}
                    />
                  ) : (
                    <UserCircleIcon className="h-16 w-16 text-gray-300" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {profile.full_name || 'Agent Twinsk Parcel'}
                  </h2>
                  <p className="text-sm font-medium text-gray-500">
                    {profile.agency_role || 'Rôle non défini'} • {profile.agency_location || 'Localisation non définie'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Statistiques</h3>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total des colis</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.total_parcels}</dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Colis ce mois</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.parcels_this_month}</dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total clients</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.total_clients}</dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Clients actifs</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.active_clients}</dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire de profil */}
        <form onSubmit={handleSubmit} className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Informations personnelles</h3>
              <p className="mt-1 text-sm text-gray-500">
                Mettez à jour vos informations personnelles et professionnelles
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-4">
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    id="full_name"
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="col-span-6 sm:col-span-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={profile.email || ''}
                    disabled
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="col-span-6 sm:col-span-4">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="agency_role" className="block text-sm font-medium text-gray-700">
                    Rôle dans l'agence
                  </label>
                  <select
                    id="agency_role"
                    name="agency_role"
                    value={profile.agency_role || ''}
                    onChange={(e) => setProfile({ ...profile, agency_role: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Sélectionnez un rôle</option>
                    <option value="agent">Agent</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="agency_location" className="block text-sm font-medium text-gray-700">
                    Localisation
                  </label>
                  <input
                    type="text"
                    name="agency_location"
                    id="agency_location"
                    value={profile.agency_location || ''}
                    onChange={(e) => setProfile({ ...profile, agency_location: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Ex: Paris, France"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={updating}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {updating ? 'Mise à jour...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
