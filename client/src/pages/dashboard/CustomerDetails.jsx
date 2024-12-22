import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../config/supabaseClient'
import ParcelList from '../../components/ParcelList'

const CustomerDetails = () => {
  const { id } = useParams();

  const fetchCustomerDetails = async () => {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (customerError) throw customerError;

    const { data: parcels, error: parcelsError } = await supabase
      .from('parcels')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    if (parcelsError) throw parcelsError;

    return { customer, parcels };
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: fetchCustomerDetails,
  });

  if (isLoading) return <div className="text-center">Chargement...</div>;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  const { customer, parcels } = data;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Détails du Client</h1>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Nom</p>
              <p className="font-medium">{customer.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Téléphone</p>
              <p className="font-medium">{customer.phone}</p>
            </div>
            <div>
              <p className="text-gray-600">Email</p>
              <p className="font-medium">{customer.email}</p>
            </div>
            <div>
              <p className="text-gray-600">Adresse</p>
              <p className="font-medium">{customer.address}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Historique des Envois</h2>
          <ParcelList parcels={parcels} showCustomerInfo={false} />
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;
