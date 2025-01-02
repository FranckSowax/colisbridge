import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabaseClient';

export const useCalculatePrice = ({ country, shippingType, weight, cbm }) => {
  return useQuery({
    queryKey: ['price-calculation', country, shippingType, weight, cbm],
    queryFn: async () => {
      if (!country || !shippingType || (!weight && !cbm)) {
        return { total: 0, formatted: '-' };
      }

      // Récupérer d'abord la règle de prix
      const { data: rules, error: rulesError } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('country_code', country.toLowerCase())
        .eq('shipping_type', shippingType.toLowerCase())
        .single();

      if (rulesError) throw rulesError;
      if (!rules) throw new Error('Aucune règle de tarification trouvée');

      // Calculer le prix total
      let totalPrice = 0;
      if (rules.unit_type === 'kg' && weight) {
        totalPrice = rules.price_per_unit * weight;
      } else if (rules.unit_type === 'cbm' && cbm) {
        totalPrice = rules.price_per_unit * cbm;
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
    enabled: Boolean(country && shippingType && (weight || cbm))
  });
};
