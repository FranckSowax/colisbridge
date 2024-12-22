const { supabaseAdmin } = require('../config/supabase');
const logger = require('../utils/logger');

exports.authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Token d\'authentification manquant' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      logger.error('Erreur d\'authentification:', error);
      return res.status(401).json({ error: 'Token invalide' });
    }

    // Récupérer le profil complet de l'utilisateur
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logger.error('Erreur lors de la récupération du profil:', profileError);
      return res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
    }

    req.user = { ...user, profile };
    next();
  } catch (error) {
    logger.error('Erreur dans le middleware d\'authentification:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.profile) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (!roles.includes(req.user.profile.role)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    next();
  };
};
