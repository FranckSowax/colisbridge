const MANYCHAT_WEBHOOK_URL = import.meta.env.VITE_MANYCHAT_WEBHOOK_URL

const sendNotification = async (parcel, status, message) => {
  if (!MANYCHAT_WEBHOOK_URL) {
    console.warn('URL du webhook ManyChat non configurée')
    return
  }

  try {
    const response = await fetch(MANYCHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tracking_number: parcel.tracking_number,
        status,
        customer_phone: parcel.customer?.phone,
        message
      })
    })
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error)
    return null
  }
}

const statusActions = {
  recu: async (parcel) => {
    console.log('Colis reçu:', parcel.tracking_number)
  },
  
  expedie: async (parcel) => {
    return sendNotification(
      parcel,
      'expedie',
      `Votre colis ${parcel.tracking_number} a été expédié et est en route vers sa destination.`
    )
  },
  
  receptionne: async (parcel) => {
    return sendNotification(
      parcel,
      'receptionne',
      `Votre colis ${parcel.tracking_number} est arrivé à destination et est en attente de livraison.`
    )
  },
  
  termine: async (parcel) => {
    return sendNotification(
      parcel,
      'termine',
      `Votre colis ${parcel.tracking_number} a été livré avec succès. Merci de votre confiance !`
    )
  },
  
  litige: async (parcel) => {
    return sendNotification(
      parcel,
      'litige',
      `Un problème a été signalé avec votre colis ${parcel.tracking_number}. Notre service client va vous contacter prochainement.`
    )
  }
}

export const handleStatusChange = async (parcel, newStatus) => {
  try {
    if (statusActions[newStatus]) {
      await statusActions[newStatus](parcel)
    }
  } catch (error) {
    console.error('Erreur lors du traitement du changement de statut:', error)
  }
}

export const getStatusLabel = (status) => {
  const labels = {
    recu: 'Reçu',
    expedie: 'Expédié',
    receptionne: 'Réceptionné',
    termine: 'Terminé',
    litige: 'Litige'
  }
  return labels[status] || status
}

export const getStatusColor = (status) => {
  const colors = {
    recu: 'bg-gray-100 text-gray-800',
    expedie: 'bg-blue-100 text-blue-800',
    receptionne: 'bg-yellow-100 text-yellow-800',
    termine: 'bg-green-100 text-green-800',
    litige: 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
