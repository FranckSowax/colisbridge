import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabaseClient';

export const useParcelPrice = (parcel) => {
  return useQuery({
    queryKey: ['parcel-price', parcel?.id],
    queryFn: async () => {
      if (!parcel?.country || !parcel?.shipping_type || !parcel?.weight) {
        return { total: 0, formatted: '-' };
      }

      // Récupérer la règle de prix
      const { data: rules, error: rulesError } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('country_code', parcel.country.toLowerCase())
        .eq('shipping_type', parcel.shipping_type.toLowerCase())
        .single();

      if (rulesError) throw rulesError;
      if (!rules) throw new Error('Aucune règle de tarification trouvée');

      // Calculer le prix total
      let totalPrice = 0;
      if (rules.unit_type === 'kg') {
        totalPrice = rules.price_per_unit * parcel.weight;
      } else if (rules.unit_type === 'cbm' && parcel.cbm) {
        totalPrice = rules.price_per_unit * parcel.cbm;
      }

      return {
        total: totalPrice,
        formatted: new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: rules.currency,
          minimumFractionDigits: 2
        }).format(totalPrice),
        unitPrice: rules.price_per_unit,
        unitType: rules.unit_type,
        currency: rules.currency
      };
    },
    enabled: Boolean(parcel?.country && parcel?.shipping_type && parcel?.weight)
  });
};
