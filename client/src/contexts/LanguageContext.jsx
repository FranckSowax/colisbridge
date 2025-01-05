import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  fr: {
    // Navigation
    'navigation.dashboard': 'Tableau de bord',
    'navigation.parcels': 'Colis',
    'navigation.clients': 'Clients',
    'navigation.statistics': 'Statistiques',
    'navigation.disputes': 'Litiges',
    'navigation.profile': 'Profil',
    'navigation.settings': 'Paramètres',
    'navigation.logout': 'Déconnexion',
    
    // Dashboard
    'dashboard.welcome': 'Bienvenue',
    'dashboard.recent_parcels': 'Colis récents',
    'dashboard.no_recent_parcels': 'Aucun colis récent',
    'dashboard.status.recu': 'Reçu',
    'dashboard.status.expedie': 'Expédié',
    'dashboard.status.termine': 'Terminé',
    'dashboard.status.litige': 'En litige',
    
    // Actions
    'actions.create_parcel': 'Créer un nouveau colis',
    'actions.retry': 'Réessayer',
    'actions.refresh': 'Actualiser la page',
    'actions.try_again': 'Réessayer',
    
    // Loading states
    'loading.dashboard_data': 'Chargement des données...',
    'loading.please_wait': 'Chargement en cours...',
    
    // Errors
    'errors.not_authenticated': 'Utilisateur non connecté',
    'errors.loading_failed': 'Erreur lors du chargement des données',
    'errors.dashboard_loading_failed': 'Erreur lors du chargement du tableau de bord',
    'errors.something_went_wrong': 'Une erreur est survenue',
    'errors.component_error': 'Erreur du composant',
    'errors.auth_check_failed': 'Erreur lors de la vérification de l\'authentification',
    'errors.signout_failed': 'Erreur lors de la déconnexion',
    
    // Success messages
    'success.parcel_created': 'Colis créé avec succès',
    
    // Parcel Form
    'parcels.form.title': 'Nouveau colis',
    'parcels.form.recipientName': 'Nom du destinataire',
    'parcels.form.recipientEmail': 'Email du destinataire',
    'parcels.form.recipientPhone': 'Téléphone du destinataire',
    'parcels.form.recipientAddress': 'Adresse du destinataire',
    'parcels.form.recipient.search': 'Rechercher un destinataire...',
    'parcels.form.recipient.new': 'Nouveau destinataire',
    'parcels.form.recipient.select': 'Sélectionner un destinataire',
    'parcels.form.shippingType': 'Type d\'expédition',
    'parcels.form.shippingType.standard': 'Standard',
    'parcels.form.shippingType.express': 'Express',
    'parcels.form.shippingType.maritime': 'Maritime',
    'parcels.form.country': 'Pays',
    'parcels.form.country.france': 'France',
    'parcels.form.country.gabon': 'Gabon',
    'parcels.form.country.togo': 'Togo',
    'parcels.form.country.cote_ivoire': 'Côte d\'Ivoire',
    'parcels.form.country.dubai': 'Dubaï',
    'parcels.form.city': 'Ville',
    'parcels.form.postalCode': 'Code postal',
    'parcels.form.weight': 'Poids (kg)',
    'parcels.form.dimensions': 'Dimensions (cm)',
    'parcels.form.cbm': 'Volume (CBM)',
    'parcels.form.price': 'Prix estimé',
    'parcels.form.specialInstructions': 'Instructions spéciales',
    'parcels.form.photos.label': 'Photos',
    'parcels.form.photos.upload': 'Télécharger des photos',
    'parcels.form.photos.dragDrop': 'ou glisser-déposer',
    'parcels.form.photos.formats': 'PNG, JPG jusqu\'à 10MB',
    'parcels.form.submit': 'Créer le colis',
    'parcels.form.cancel': 'Annuler',
    'parcels.form.shipping.calculating': 'Calcul en cours...',
    'parcels.form.errors.photoLimit': 'Maximum {{max}} photos autorisées',
    'parcels.form.errors.cbmRequired': 'Le volume (CBM) est requis pour l\'expédition maritime',
    'parcels.form.errors.weightRequired': 'Le poids est requis pour ce type d\'expédition',
    'parcels.form.errors.priceCalculation': 'Impossible de calculer le prix',
    'parcels.form.errors.recipientCreation': 'Erreur lors de la création du destinataire',
    'parcels.form.errors.recipientSelection': 'Veuillez sélectionner un destinataire',
    // Photo Upload
    'parcels.form.upload.button': 'Télécharger des photos',
    'parcels.form.upload.dragndrop': 'ou glisser-déposer',
    'parcels.form.upload.formats': 'PNG, JPG jusqu\'à 10MB',
  },
  en: {
    // Navigation
    'navigation.dashboard': 'Dashboard',
    'navigation.parcels': 'Parcels',
    'navigation.clients': 'Clients',
    'navigation.statistics': 'Statistics',
    'navigation.disputes': 'Disputes',
    'navigation.profile': 'Profile',
    'navigation.settings': 'Settings',
    'navigation.logout': 'Logout',
    
    // Dashboard
    'dashboard.welcome': 'Welcome',
    'dashboard.recent_parcels': 'Recent Parcels',
    'dashboard.no_recent_parcels': 'No recent parcels',
    'dashboard.status.recu': 'Received',
    'dashboard.status.expedie': 'Shipped',
    'dashboard.status.termine': 'Completed',
    'dashboard.status.litige': 'Disputed',
    
    // Actions
    'actions.create_parcel': 'Create New Parcel',
    'actions.retry': 'Retry',
    'actions.refresh': 'Refresh page',
    'actions.try_again': 'Try again',
    
    // Loading states
    'loading.dashboard_data': 'Loading dashboard data...',
    'loading.please_wait': 'Loading...',
    
    // Errors
    'errors.not_authenticated': 'User not authenticated',
    'errors.loading_failed': 'Failed to load data',
    'errors.dashboard_loading_failed': 'Failed to load dashboard',
    'errors.something_went_wrong': 'Something went wrong',
    'errors.component_error': 'Component Error',
    'errors.auth_check_failed': 'Authentication check failed',
    'errors.signout_failed': 'Sign out failed',
    
    // Success messages
    'success.parcel_created': 'Parcel created successfully',
    
    // Parcel Form
    'parcels.form.title': 'New Parcel',
    'parcels.form.recipientName': 'Recipient Name',
    'parcels.form.recipientEmail': 'Recipient Email',
    'parcels.form.recipientPhone': 'Recipient Phone',
    'parcels.form.recipientAddress': 'Recipient Address',
    'parcels.form.recipient.search': 'Search for a recipient...',
    'parcels.form.recipient.new': 'New Recipient',
    'parcels.form.recipient.select': 'Select a recipient',
    'parcels.form.shippingType': 'Shipping Type',
    'parcels.form.shippingType.standard': 'Standard',
    'parcels.form.shippingType.express': 'Express',
    'parcels.form.shippingType.maritime': 'Maritime',
    'parcels.form.country': 'Country',
    'parcels.form.country.france': 'France',
    'parcels.form.country.gabon': 'Gabon',
    'parcels.form.country.togo': 'Togo',
    'parcels.form.country.cote_ivoire': 'Ivory Coast',
    'parcels.form.country.dubai': 'Dubai',
    'parcels.form.city': 'City',
    'parcels.form.postalCode': 'Postal Code',
    'parcels.form.weight': 'Weight (kg)',
    'parcels.form.dimensions': 'Dimensions (cm)',
    'parcels.form.cbm': 'Volume (CBM)',
    'parcels.form.price': 'Estimated Price',
    'parcels.form.specialInstructions': 'Special Instructions',
    'parcels.form.photos.label': 'Photos',
    'parcels.form.photos.upload': 'Upload photos',
    'parcels.form.photos.dragDrop': 'or drag and drop',
    'parcels.form.photos.formats': 'PNG, JPG up to 10MB',
    'parcels.form.submit': 'Create Parcel',
    'parcels.form.cancel': 'Cancel',
    'parcels.form.shipping.calculating': 'Calculating...',
    'parcels.form.errors.photoLimit': 'Maximum {{max}} photos allowed',
    'parcels.form.errors.cbmRequired': 'CBM is required for maritime shipping',
    'parcels.form.errors.weightRequired': 'Weight is required for this shipping type',
    'parcels.form.errors.priceCalculation': 'Unable to calculate price',
    'parcels.form.errors.recipientCreation': 'Failed to create recipient',
    'parcels.form.errors.recipientSelection': 'Please select a recipient',
    // Photo Upload
    'parcels.form.upload.button': 'Upload photos',
    'parcels.form.upload.dragndrop': 'or drag and drop',
    'parcels.form.upload.formats': 'PNG, JPG up to 10MB',
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'fr';
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage);
    }
    setLoading(false);
  }, []);

  const changeLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage);
      localStorage.setItem('language', newLanguage);
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
