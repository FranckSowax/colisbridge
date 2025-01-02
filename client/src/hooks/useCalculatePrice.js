import { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

export function useCalculatePrice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculatePrice = async ({ country, shippingType, weight, cbm }) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'calculate_parcel_price',
        {
          p_country: country,
          p_shipping_type: shippingType,
          p_weight: weight || null,
          p_cbm: cbm || null
        }
      );

      if (rpcError) throw rpcError;

      if (!data.success) {
        throw new Error(data.error);
      }

      return {
        totalPrice: data.total_price,
        currency: data.currency,
        formattedPrice: formatPrice(data.total_price, data.currency)
      };
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount, currency) => {
    if (!amount || !currency) return '';

    const formatOptions = {
      EUR: { style: 'currency', currency: 'EUR' },
      USD: { style: 'currency', currency: 'USD' },
      XAF: { 
        style: 'currency',
        currency: 'XAF',
        currencyDisplay: 'code'
      }
    };

    try {
      return new Intl.NumberFormat('fr-FR', formatOptions[currency] || {}).format(amount);
    } catch (error) {
      console.error('Error formatting price:', error);
      return `${amount} ${currency}`;
    }
  };

  return {
    calculatePrice,
    loading,
    error
  };
}
