import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../config/supabaseClient';

// Logo Twinsk URL
const LOGO_URL = 'https://i.imgur.com/ZU2ZGQk.png';

// Fonction de formatage de la devise
const formatCurrency = (amount) => {
  if (!amount) return '0 XAF';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' XAF';
};

const calculatePrice = async ({ country, shippingType, weight, cbm }) => {
  if (!country || !shippingType || (!weight && !cbm)) {
    return 0;
  }

  try {
    const { data: rules, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('country_code', country.toLowerCase())
      .eq('shipping_type', shippingType.toLowerCase())
      .single();

    if (error) throw error;
    if (!rules) return 0;

    let totalPrice = 0;
    if (rules.unit_type === 'kg' && weight) {
      totalPrice = rules.price_per_unit * weight;
    } else if (rules.unit_type === 'cbm' && cbm) {
      totalPrice = rules.price_per_unit * cbm;
    }

    return totalPrice;
  } catch (error) {
    console.error('Error calculating price:', error);
    return 0;
  }
};

const InvoicePreview = ({ data }) => {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchPrice = async () => {
      const price = await calculatePrice({
        country: data?.country,
        shippingType: data?.shipping_type,
        weight: data?.weight,
        cbm: data?.volume
      });
      setTotal(price);
    };

    fetchPrice();
  }, [data]);

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white">
      <div className="flex justify-between items-start mb-8">
        <img
          src={LOGO_URL}
          alt="Logo"
          className="w-24 h-24 object-contain"
        />
        <div className="text-right">
          <h1 className="text-2xl font-bold text-[#2E75B5] mb-2">TWINSK COMPANY</h1>
          <p>506, Tongyue Building</p>
          <p>No.7, Tongya East Street Xicha Road</p>
          <p>Baiyun District, Guangzhou, China</p>
          <p>Logistics@twinskcompanyltd.com</p>
          <p>Address: Gabon Libreville</p>
          <p>Tel: +8613928824921</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-[#2E75B5] mb-2">FACTURE #{data?.tracking_number || ''}</h2>
        <p>Date d'émission : {format(new Date(), 'dd MMMM yyyy', { locale: fr })}</p>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-bold text-[#2E75B5] mb-2">DESTINATAIRE</h3>
          <p>{data?.recipient_name || ''}</p>
          <p>Tel: {data?.recipient_phone || ''}</p>
        </div>
        <div>
          <h3 className="font-bold text-[#2E75B5] mb-2">EXPÉDITION</h3>
          <p>Type: {data?.shipping_type || ''}</p>
          <p>Destination: {data?.country ? data.country.toUpperCase() : ''}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-bold text-[#2E75B5] mb-4">DÉTAILS DU COLIS</h3>
        <table className="w-full">
          <thead className="bg-[#2E75B5] text-white">
            <tr>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-left">Type d'envoi</th>
              <th className="p-2 text-left">Poids/Volume</th>
              <th className="p-2 text-right">Prix</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2">Colis</td>
              <td className="p-2">{data?.shipping_type || ''}</td>
              <td className="p-2">{data?.weight ? `${data.weight} kg` : ''}</td>
              <td className="p-2 text-right">{total} XAF</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between mb-2">
            <span>Sous-total</span>
            <span>{total} XAF</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>TVA (0%)</span>
            <span>0 FCFA</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{total} XAF</span>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-600 mb-4">
        <p>Please make all checks payable to TWINSK LOGISTICS.</p>
        <p>Thanks for your business</p>
      </div>

      <div className="text-center text-sm text-[#2E75B5]">
        <p>
          <a href="mailto:Logistics@twinskcompanyltd.com">Logistics@twinskcompanyltd.com</a> |{' '}
          <a href="http://www.twinskcompanyltd.com">www.twinskcompanyltd.com</a>
        </p>
      </div>
    </div>
  );
};

export default InvoicePreview;
