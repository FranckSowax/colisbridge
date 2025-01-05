export const COUNTRY_CURRENCIES = {
  france: { code: 'EUR', symbol: '€' },
  gabon: { code: 'XAF', symbol: 'FCFA' },
  togo: { code: 'XOF', symbol: 'FCFA' },
  cote_ivoire: { code: 'XOF', symbol: 'FCFA' },
  dubai: { code: 'AED', symbol: 'د.إ' }
};

export const formatCurrency = (amount, currency = 'EUR') => {
  if (!amount) return '-';
  
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(amount);
};
