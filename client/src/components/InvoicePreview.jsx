import React from 'react';
import { useCalculatePrice } from '../hooks/useCalculatePrice';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

const InvoicePreview = ({ data }) => {
  const { data: priceData } = useCalculatePrice({
    country: data?.country,
    shippingType: data?.shipping_type,
    weight: data?.weight,
    cbm: data?.volume
  });

  const total = priceData?.total || 0;
  const formattedTotal = total + ' FCFA';

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white">
      {/* En-tête avec logo et informations de l'entreprise */}
      <div className="flex justify-between items-start mb-12">
        <div className="w-32">
          <img
            src={LOGO_URL}
            alt="Twinsk Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-[#2E75B5] mb-4">TWINSK COMPANY</h1>
          <div className="text-gray-600 text-sm">
            <p>506, Tongyue Building</p>
            <p>No.7, Tongya East Street Xicha Road</p>
            <p>Baiyun District, Guangzhou, China</p>
            <p>Logistics@twinskcompanyltd.com</p>
            <p>Address: Gabon Libreville</p>
            <p>Tel: +8613928824921</p>
          </div>
        </div>
      </div>

      {/* Numéro de facture et date */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#2E75B5] mb-2">FACTURE #{data?.reference}</h2>
        <p className="text-gray-600">Date d'émission : {format(new Date(), 'dd MMMM yyyy', { locale: fr })}</p>
      </div>

      {/* Sections DESTINATAIRE et EXPÉDITION */}
      <div className="grid grid-cols-2 gap-8 mb-8 bg-gray-50 p-6 rounded-lg">
        <div>
          <h3 className="text-[#2E75B5] font-bold mb-4">DESTINATAIRE</h3>
          <p>{data?.recipient_name}</p>
          <p>{data?.recipient_address}</p>
        </div>
        <div>
          <h3 className="text-[#2E75B5] font-bold mb-4">EXPÉDITION</h3>
          <p>Type: {data?.shipping_type || 'Standard'}</p>
          <p>Destination: {data?.destination}</p>
        </div>
      </div>

      {/* Section DÉTAILS DU COLIS */}
      <div className="mb-8">
        <h3 className="text-[#2E75B5] font-bold mb-4">DÉTAILS DU COLIS</h3>
        <table className="w-full">
          <thead>
            <tr className="bg-[#2E75B5] text-white">
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Type d'envoi</th>
              <th className="p-3 text-left">Poids/Volume</th>
              <th className="p-3 text-right">Prix</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-3">Colis</td>
              <td className="p-3">{data?.shipping_type || 'Standard'}</td>
              <td className="p-3">{data?.weight} kg</td>
              <td className="p-3 text-right">{formattedTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totaux */}
      <div className="flex justify-end mb-12">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Sous-total</span>
            <span>{formattedTotal}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">TVA (0%)</span>
            <span>0 FCFA</span>
          </div>
          <div className="flex justify-between py-2 font-bold text-[#2E75B5]">
            <span>Total</span>
            <span>{formattedTotal}</span>
          </div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="text-center text-gray-600 text-sm">
        <p>Please make all checks payable to TWINSK LOGISTICS.</p>
        <p>Thanks for your business</p>
        <p className="mt-2">
          <a href="mailto:Logistics@twinskcompanyltd.com" className="text-[#2E75B5]">Logistics@twinskcompanyltd.com</a>
          {' | '}
          <a href="http://www.twinskcompanyltd.com" className="text-[#2E75B5]">www.twinskcompanyltd.com</a>
        </p>
      </div>
    </div>
  );
};

export default InvoicePreview;
