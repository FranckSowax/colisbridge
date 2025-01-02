import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { toast } from 'react-hot-toast';

const CURRENCIES = {
  france: { symbol: '€', code: 'EUR', decimals: 2 },
  dubai: { symbol: '$', code: 'USD', decimals: 2 },
  gabon: { symbol: 'CFA', code: 'XAF', decimals: 0 },
  togo: { symbol: 'CFA', code: 'XAF', decimals: 0 },
  cote_ivoire: { symbol: 'CFA', code: 'XAF', decimals: 0 }
};

const SHIPPING_TYPES = ['standard', 'express', 'maritime'];

const PRICE_FIELDS = {
  standard: ['price_per_kg'],
  express: ['price_per_kg'],
  maritime: ['price_per_cbm']
};

// Prix par défaut
const DEFAULT_PRICES = {
  france: {
    standard: { price_per_kg: 10 },
    express: { price_per_kg: 20 },
    maritime: { price_per_cbm: 100 }
  },
  dubai: {
    standard: { price_per_kg: 20 },
    express: { price_per_kg: 30 },
    maritime: { price_per_cbm: 200 }
  },
  gabon: {
    standard: { price_per_kg: 15000 },
    express: { price_per_kg: 25000 },
    maritime: { price_per_cbm: 300000 }
  },
  togo: {
    standard: { price_per_kg: 15 },
    express: { price_per_kg: 25 },
    maritime: { price_per_cbm: 150 }
  },
  cote_ivoire: {
    standard: { price_per_kg: 15 },
    express: { price_per_kg: 25 },
    maritime: { price_per_cbm: 150 }
  }
};

export default function PricingTable() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    initializePrices();
  }, []);

  const initializePrices = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data: existingRules, error: fetchError } = await supabase
        .from('pricing_rules')
        .select('*');

      if (fetchError) throw fetchError;

      // Créer un tableau de promesses pour les insertions
      const insertPromises = [];

      Object.entries(DEFAULT_PRICES).forEach(([country, countryPrices]) => {
        Object.entries(countryPrices).forEach(([type, prices]) => {
          const existingRule = existingRules?.find(
            rule => rule.country_code === country && rule.shipping_type === type
          );

          if (!existingRule) {
            const priceData = {
              country_code: country,
              shipping_type: type,
              ...prices,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            insertPromises.push(
              supabase
                .from('pricing_rules')
                .insert([priceData])
                .select()
            );
          }
        });
      });

      if (insertPromises.length > 0) {
        await Promise.all(insertPromises);
      }

      // Recharger les prix après l'initialisation
      await fetchPrices();
    } catch (error) {
      console.error('Error initializing prices:', error);
      toast.error('Erreur lors de l\'initialisation des prix');
      setLoading(false);
    }
  };

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*');

      if (error) throw error;

      const organizedData = Object.keys(CURRENCIES).map(country => {
        const countryPrices = {};
        SHIPPING_TYPES.forEach(type => {
          const priceRule = data?.find(
            rule => rule.country_code === country && rule.shipping_type === type
          );
          countryPrices[type] = {
            price_per_kg: priceRule?.price_per_kg || 0,
            price_per_cbm: priceRule?.price_per_cbm || 0,
            id: priceRule?.id || null
          };
        });
        return {
          country,
          ...countryPrices
        };
      });

      setPrices(organizedData);
    } catch (error) {
      console.error('Error fetching prices:', error);
      toast.error('Erreur lors du chargement des prix');
    } finally {
      setLoading(false);
    }
  };

  const updatePrice = async (country, type, value, field) => {
    try {
      const price = parseFloat(value);
      if (isNaN(price) || price < 0) {
        throw new Error('Prix invalide');
      }

      const priceData = prices.find(p => p.country === country);
      if (!priceData) throw new Error('Pays non trouvé');

      const existingRule = priceData[type];
      let result;

      if (existingRule.id) {
        const { data, error } = await supabase
          .from('pricing_rules')
          .update({
            [field]: price,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRule.id)
          .select();

        if (error) throw error;
        result = data[0];
      } else {
        const { data, error } = await supabase
          .from('pricing_rules')
          .insert([{
            country_code: country,
            shipping_type: type,
            [field]: price,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select();

        if (error) throw error;
        result = data[0];
      }

      setPrices(currentPrices => 
        currentPrices.map(row => {
          if (row.country === country) {
            return {
              ...row,
              [type]: {
                ...row[type],
                [field]: price,
                id: result?.id || row[type].id
              }
            };
          }
          return row;
        })
      );

      toast.success('Prix mis à jour avec succès');
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour du prix');
      await fetchPrices();
    }
  };

  const formatPrice = (price, country) => {
    if (price === 0 || price === null) return '-';
    const decimals = CURRENCIES[country].decimals;
    return `${price.toFixed(decimals)} ${CURRENCIES[country].symbol}`;
  };

  const handleCellClick = (country, type, field, value) => {
    setEditingCell(`${country}-${type}-${field}`);
    setEditValue(value === 0 ? '' : value.toString());
  };

  const handleCellBlur = async (country, type, field) => {
    if (editValue !== '') {
      await updatePrice(country, type, editValue, field);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyPress = async (e, country, type, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editValue !== '') {
        await updatePrice(country, type, editValue, field);
      }
      setEditingCell(null);
      setEditValue('');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Pays</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Standard</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Express</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Maritime</th>
          </tr>
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500"></th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Prix/kg</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Prix/kg</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Prix/m³</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {prices.map((row) => (
            <tr key={row.country}>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">
                {row.country.toUpperCase()} ({CURRENCIES[row.country].code})
              </td>
              {SHIPPING_TYPES.map(type => {
                const priceField = PRICE_FIELDS[type][0];
                const fieldName = priceField === 'price_per_kg' ? 'price_per_kg' : 'price_per_cbm';
                return (
                  <td key={type} className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {editingCell === `${row.country}-${type}-${fieldName}` ? (
                      <input
                        type="number"
                        step={CURRENCIES[row.country].decimals === 0 ? "1" : "0.01"}
                        min="0"
                        className="w-24 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellBlur(row.country, type, fieldName)}
                        onKeyDown={(e) => handleKeyPress(e, row.country, type, fieldName)}
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => handleCellClick(row.country, type, fieldName, row[type][fieldName])}
                        className="hover:bg-gray-100 px-2 py-1 rounded w-full text-left"
                      >
                        {formatPrice(row[type][fieldName], row.country)}
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
