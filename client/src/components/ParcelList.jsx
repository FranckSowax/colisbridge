import React, { Fragment, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../config/supabaseClient'
import { formatDate } from '@utils/dateUtils';
import { Menu } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import ParcelDetailsDrawer from './ParcelDetailsDrawer';
import toast from 'react-hot-toast';

const COUNTRIES = {
  france: { name: 'France', flag: '🇫🇷' },
  gabon: { name: 'Gabon', flag: '🇬🇦' },
  togo: { name: 'Togo', flag: '🇹🇬' },
  cote_ivoire: { name: "Côte d'Ivoire", flag: '🇨🇮' },
  dubai: { name: 'Dubaï', flag: '🇦🇪' }
};

const statusLabels = {
  recu: 'Reçu',
  expedie: 'Expédié',
  receptionne: 'Réceptionné',
  termine: 'Terminé'
};

const statusColors = {
  recu: 'bg-yellow-100 text-yellow-800',
  expedie: 'bg-blue-100 text-blue-800',
  receptionne: 'bg-green-100 text-green-800',
  termine: 'bg-gray-100 text-gray-800'
};

export default function ParcelList({ parcels = [], showCustomerInfo = true, onStatusChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [pricingRules, setPricingRules] = useState({});
  const pageSize = 10;

  useEffect(() => {
    fetchPricingRules();
  }, []);

  const fetchPricingRules = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*');
      
      if (error) throw error;
      
      // Organiser les règles par pays et type d'envoi
      const rules = {};
      data.forEach(rule => {
        if (!rules[rule.country_code]) {
          rules[rule.country_code] = {};
        }
        rules[rule.country_code][rule.shipping_type] = rule;
      });
      
      setPricingRules(rules);
    } catch (error) {
      console.error('Error fetching pricing rules:', error);
    }
  };

  const calculatePrice = (parcel) => {
    if (!pricingRules[parcel.country]?.[parcel.shipping_type]) {
      return null;
    }

    const rule = pricingRules[parcel.country][parcel.shipping_type];
    
    if (['standard', 'express'].includes(parcel.shipping_type) && parcel.weight) {
      return (parcel.weight * rule.price_per_kg).toFixed(2);
    } else if (parcel.shipping_type === 'maritime' && parcel.cbm) {
      return (parcel.cbm * rule.price_per_cbm).toFixed(2);
    }
    
    return null;
  };

  const generateInvoice = async (parcel) => {
    const price = calculatePrice(parcel);
    if (!price) {
      toast.error('Impossible de générer la facture : tarif non trouvé');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('parcels')
        .update({
          price: price,
          invoice_number: `INV-${Date.now()}`,
          invoice_date: new Date().toISOString(),
          invoice_status: 'generated'
        })
        .eq('id', parcel.id);

      if (error) throw error;
      toast.success('Facture générée avec succès');
      // Rafraîchir les données
      window.location.reload();
    } catch (error) {
      toast.error('Erreur lors de la génération de la facture');
      console.error('Error:', error);
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['parcels', currentPage, searchQuery],
    queryFn: async () => {
      const query = supabase
        .from('parcels')
        .select(`
          *,
          recipients (
            name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query.or(`
          recipients.name.ilike.%${searchQuery}%,
          recipients.phone.ilike.%${searchQuery}%,
          tracking_number.ilike.%${searchQuery}%
        `);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const openDrawer = (parcel) => {
    setSelectedParcel(parcel);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedParcel(null);
  };

  const handleStatusChange = (parcel, newStatus) => {
    onStatusChange(parcel, newStatus);
  };

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  const filteredData = data || [];

  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Liste des colis</h1>
            <p className="mt-2 text-sm text-gray-700">
              Liste de tous les colis avec leurs détails et statuts
            </p>
          </div>
        </div>

        <div className="mt-4">
          <input
            type="text"
            placeholder="Rechercher par destinataire, téléphone ou N° de suivi..."
            value={searchQuery}
            onChange={handleSearch}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div className="mt-8 space-y-4">
          {filteredData.map((parcel) => (
            <div key={parcel.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex flex-col space-y-3">
                {/* Status Badge */}
                <div className="flex justify-between items-start">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusColors[parcel.status]}`}>
                    {statusLabels[parcel.status]}
                  </span>
                  
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center text-gray-400 hover:text-gray-600">
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </Menu.Button>
                    <Menu.Items className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      <div className="py-1">
                        {Object.entries(statusLabels).map(([status, label]) => (
                          <Menu.Item key={status}>
                            {({ active }) => (
                              <button
                                onClick={() => handleStatusChange(parcel, status)}
                                className={`${
                                  active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                } block px-4 py-2 text-sm w-full text-left`}
                                disabled={parcel.status === status}
                              >
                                {label}
                              </button>
                            )}
                          </Menu.Item>
                        ))}
                      </div>
                    </Menu.Items>
                  </Menu>
                </div>

                {/* Tracking Number */}
                <div className="text-lg font-medium text-gray-900">
                  {parcel.tracking_number}
                </div>

                {/* Customer Info */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">👤</span>
                    <span>{parcel.recipients?.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">📞</span>
                    <span>{parcel.recipients?.phone}</span>
                  </div>
                </div>

                {/* Shipping Details */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">🌍</span>
                    <span>{parcel.country && COUNTRIES[parcel.country] ? (
                      <span>
                        {COUNTRIES[parcel.country].flag} {COUNTRIES[parcel.country].name}
                      </span>
                    ) : '-'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">🚚</span>
                    <span>{parcel.shipping_type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">⚖️</span>
                    <span>{parcel.weight ? `${parcel.weight} kg` : `${parcel.cbm} m³`}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">📅</span>
                    <span>Créé le {formatDate(parcel.created_at)}</span>
                  </div>
                  {parcel.shipping_date && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">✈️</span>
                      <span>Envoyé le {formatDate(parcel.shipping_date)}</span>
                    </div>
                  )}
                </div>

                {/* Prix et Facturation */}
                <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">💰</span>
                    <span className="text-sm font-medium">
                      {calculatePrice(parcel) ? `${calculatePrice(parcel)}€` : 'Prix non défini'}
                    </span>
                  </div>
                  
                  {!parcel.invoice_number && calculatePrice(parcel) && (
                    <button
                      onClick={() => generateInvoice(parcel)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Générer la facture
                    </button>
                  )}
                  
                  {parcel.invoice_number && (
                    <div className="text-sm text-gray-500">
                      Facture {parcel.invoice_number}
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-3 flex justify-end border-t border-gray-100">
                  <button
                    onClick={() => openDrawer(parcel)}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    Voir les détails
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ParcelDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        parcel={selectedParcel}
      />
    </>
  );
}
