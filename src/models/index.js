const sequelize = require('../config/database');
const User = require('./User');
const Parcel = require('./Parcel');
const ParcelStatusHistory = require('./ParcelStatusHistory');

// Relations User - Parcel
User.hasMany(Parcel, {
  foreignKey: 'userId',
  as: 'parcels'
});
Parcel.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Relations Parcel - ParcelStatusHistory
Parcel.hasMany(ParcelStatusHistory, {
  foreignKey: 'parcelId',
  as: 'statusHistory'
});
ParcelStatusHistory.belongsTo(Parcel, {
  foreignKey: 'parcelId',
  as: 'parcel'
});

// Relations User - ParcelStatusHistory (pour le changedBy)
User.hasMany(ParcelStatusHistory, {
  foreignKey: 'changedBy',
  as: 'statusChanges'
});
ParcelStatusHistory.belongsTo(User, {
  foreignKey: 'changedBy',
  as: 'changedByUser'
});

const models = {
  User,
  Parcel,
  ParcelStatusHistory,
  sequelize
};

module.exports = models;
