const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ParcelStatusHistory = sequelize.define('ParcelStatusHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING
  },
  notes: {
    type: DataTypes.TEXT
  },
  changedBy: {
    type: DataTypes.UUID,
    allowNull: false
  },
  notificationSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = ParcelStatusHistory;
