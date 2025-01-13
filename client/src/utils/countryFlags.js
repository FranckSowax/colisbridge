// Mapping des codes pays vers les noms complets
const countryNames = {
  'FR': 'FRANCE',
  'BE': 'BELGIQUE',
  'CH': 'SUISSE',
  'DE': 'ALLEMAGNE',
  'ES': 'ESPAGNE',
  'IT': 'ITALIE',
  'GB': 'ROYAUME-UNI',
  'NL': 'PAYS-BAS',
  'PT': 'PORTUGAL',
  'US': 'ÉTATS-UNIS',
  // Ajoutez d'autres pays selon vos besoins
};

// Fonction pour obtenir le nom du pays
export function getCountryWithFlag(countryCode) {
  if (!countryCode) return 'INCONNU';
  return countryNames[countryCode.toUpperCase()] || countryCode.toUpperCase();
}
