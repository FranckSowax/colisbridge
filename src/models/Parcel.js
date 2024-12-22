const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Parcel = sequelize.define('Parcel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  trackingNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'received',      // Reçu en point relais/entrepôt
      'preparing',     // En préparation
      'in_transit',    // En transit
      'in_customs',    // En dédouanement
      'out_for_delivery', // En cours de livraison
      'delivered',     // Livré
      'issue'         // Problème
    ),
    defaultValue: 'received'
  },
  originCountry: {
    type: DataTypes.ENUM('China'),
    allowNull: false
  },
  destinationCountry: {
    type: DataTypes.ENUM('Gabon', 'Togo', 'Ivory Coast'),
    allowNull: false
  },
  weight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  length: {
    type: DataTypes.DECIMAL(10, 2)
  },
  width: {
    type: DataTypes.DECIMAL(10, 2)
  },
  height: {
    type: DataTypes.DECIMAL(10, 2)
  },
  declaredValue: {
    type: DataTypes.DECIMAL(10, 2)
  },
  description: {
    type: DataTypes.TEXT
  },
  photos: {
    type: DataTypes.JSON, // URLs des photos
    defaultValue: []
  },
  customsDeclaration: {
    type: DataTypes.JSON, // Informations de déclaration douanière
    defaultValue: {}
  },
  estimatedDeliveryDate: {
    type: DataTypes.DATE
  },
  actualDeliveryDate: {
    type: DataTypes.DATE
  },
  notes: {
    type: DataTypes.TEXT
  },
  lastStatusUpdate: {
    type: DataTypes.DATE
  }
});

// Hook pour mettre à jour lastStatusUpdate
Parcel.beforeUpdate(async (parcel) => {
  if (parcel.changed('status')) {
    parcel.lastStatusUpdate = new Date();
  }
});

module.exports = Parcel;
