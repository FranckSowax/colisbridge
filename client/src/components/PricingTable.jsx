import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import toast from 'react-hot-toast';

const PricingTable = () => {
  const [pricingData, setPricingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPricingData();
  }, []);

  const fetchPricingData = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .order('country_code', { ascending: true });

      if (error) throw error;

      const organizedData = data.reduce((acc, rule) => {
        if (!acc[rule.country_code]) {
          acc[rule.country_code] = {
            country: rule.country_code,
            currency: rule.currency,
            prices: {}
          };
        }
        acc[rule.country_code].prices[rule.shipping_type] = {
          price: rule.price_per_unit,
          unit: rule.unit_type
        };
        return acc;
      }, {});

      setPricingData(Object.values(organizedData));
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des prix:', error);
      setError(error.message);
      setLoading(false);
      toast.error('Erreur lors de la récupération des prix');
    }
  };

  const handlePriceUpdate = async (country, shippingType, newPrice) => {
    try {
      const { error } = await supabase
        .from('pricing_rules')
        .update({ 
          price_per_unit: newPrice,
          updated_at: new Date().toISOString()
        })
        .match({ 
          country_code: country,
          shipping_type: shippingType
        });

      if (error) throw error;

      toast.success('Prix mis à jour avec succès');
      await fetchPricingData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du prix:', error);
      toast.error('Erreur lors de la mise à jour du prix');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  );

  if (error) return (
    <div className="p-4 text-red-500 bg-red-50 rounded-lg">
      Erreur: {error}
    </div>
  );

  return (
    <div className="w-full">
      {/* Version mobile */}
      <div className="block sm:hidden">
        {pricingData.map((row) => (
          <div key={row.country} className="mb-6 bg-white rounded-lg shadow">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {row.country.toUpperCase()} ({row.currency})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {['standard', 'express', 'maritime'].map((type) => (
                <div key={type} className="px-4 py-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700 capitalize">
                      {type}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.prices[type]?.price || ''}
                        onChange={(e) => {
                          const newPrice = parseFloat(e.target.value);
                          if (!isNaN(newPrice)) {
                            handlePriceUpdate(row.country, type, newPrice);
                          }
                        }}
                        className="w-24 px-2 py-1 text-right border rounded focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <span className="text-sm text-gray-500">
                        {row.prices[type]?.unit === 'kg' ? '/kg' : '/m³'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Version desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pays
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Standard (Prix/kg)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Express (Prix/kg)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Maritime (Prix/m³)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pricingData.map((row) => (
              <tr key={row.country}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {row.country.toUpperCase()} ({row.currency})
                </td>
                {['standard', 'express', 'maritime'].map((type) => (
                  <td key={type} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.prices[type]?.price || ''}
                        onChange={(e) => {
                          const newPrice = parseFloat(e.target.value);
                          if (!isNaN(newPrice)) {
                            handlePriceUpdate(row.country, type, newPrice);
                          }
                        }}
                        className="w-24 px-2 py-1 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <span>
                        {row.prices[type]?.unit === 'kg' ? '/kg' : '/m³'}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PricingTable;
