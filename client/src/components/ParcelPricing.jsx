import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { toast } from 'react-hot-toast';

export default function ParcelPricing({ parcel }) {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrice();
  }, [parcel]);

  const fetchPrice = async () => {
    if (!parcel?.country || !parcel?.shipping_type) {
      setLoading(false);
      return;
    }

    try {
      // Récupérer les règles de tarification
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('country_code', parcel.country.toLowerCase())
        .eq('shipping_type', parcel.shipping_type.toLowerCase());

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const rule = data[0];
        let calculatedPrice = 0;

        if (['standard', 'express'].includes(parcel.shipping_type.toLowerCase()) && parcel.weight) {
          calculatedPrice = parcel.weight * rule.price_per_kg;
        } else if (parcel.shipping_type.toLowerCase() === 'maritime' && parcel.cbm) {
          calculatedPrice = parcel.cbm * rule.price_per_cbm;
        }

        if (calculatedPrice > 0) {
          setPrice(calculatedPrice.toFixed(2));
        } else {
          console.warn('Could not calculate price:', {
            shipping_type: parcel.shipping_type,
            weight: parcel.weight,
            cbm: parcel.cbm,
            rule
          });
        }
      } else {
        console.warn('No pricing rule found for:', {
          country: parcel.country,
          shipping_type: parcel.shipping_type
        });
      }
    } catch (error) {
      console.error('Error fetching price:', error);
      toast.error('Erreur lors du calcul du prix');
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = async () => {
    if (!price) {
      toast.error('Impossible de générer la facture : prix non calculé');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('parcels')
        .update({
          price: parseFloat(price),
          invoice_number: `INV-${Date.now()}`,
          invoice_date: new Date().toISOString(),
          invoice_status: 'generated'
        })
        .eq('id', parcel.id);

      if (error) throw error;
      toast.success('Facture générée avec succès');
      window.location.reload();
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Erreur lors de la génération de la facture');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 mt-3 pt-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-gray-500">💰</span>
          <span className="text-sm font-medium">
            {price ? `${price}€` : 'Prix non défini'}
          </span>
        </div>
        
        {!parcel.invoice_number && price && (
          <button
            onClick={generateInvoice}
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
    </div>
  );
}
