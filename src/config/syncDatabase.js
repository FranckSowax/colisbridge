const models = require('../models');
const logger = require('../utils/logger');

async function syncDatabase() {
  try {
    await models.sequelize.authenticate();
    logger.info('Connection à la base de données établie avec succès.');

    // Synchroniser les modèles avec la base de données
    await models.sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('Base de données synchronisée avec succès.');

    // Créer un utilisateur admin par défaut si en développement
    if (process.env.NODE_ENV === 'development') {
      const adminExists = await models.User.findOne({
        where: { email: 'admin@colisbridge.com' }
      });

      if (!adminExists) {
        await models.User.create({
          email: 'admin@colisbridge.com',
          password: 'Admin123!',
          role: 'admin',
          firstName: 'Admin',
          lastName: 'System',
          status: 'active'
        });
        logger.info('Utilisateur admin créé avec succès.');
      }
    }
  } catch (error) {
    logger.error('Erreur lors de la synchronisation de la base de données:', error);
    throw error;
  }
}

module.exports = syncDatabase;
