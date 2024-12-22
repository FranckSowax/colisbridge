const { supabaseAdmin } = require('../config/supabase');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res) {
    try {
      const { email, password, firstName, lastName, phone, whatsappNumber, role = 'client' } = req.body;

      // Créer l'utilisateur dans Supabase Auth
      const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName
        }
      });

      if (authError) throw authError;

      // Le profil sera créé automatiquement grâce au trigger handle_new_user
      // Mettre à jour les informations supplémentaires
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          phone,
          whatsapp_number: whatsappNumber,
          role
        })
        .eq('id', user.id)
        .select()
        .single();

      if (profileError) throw profileError;

      res.status(201).json({
        message: 'Utilisateur créé avec succès',
        user: {
          id: user.id,
          email: user.email,
          profile
        }
      });
    } catch (error) {
      logger.error('Erreur lors de l\'inscription:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Récupérer le profil
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      res.json({
        message: 'Connexion réussie',
        session: data.session,
        user: {
          ...data.user,
          profile
        }
      });
    } catch (error) {
      logger.error('Erreur lors de la connexion:', error);
      res.status(401).json({ error: error.message });
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      res.json({ profile });
    } catch (error) {
      logger.error('Erreur lors de la récupération du profil:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      // Filtrer les champs autorisés
      const allowedUpdates = {
        first_name: updates.firstName,
        last_name: updates.lastName,
        phone: updates.phone,
        whatsapp_number: updates.whatsappNumber
      };

      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .update(allowedUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      res.json({
        message: 'Profil mis à jour avec succès',
        profile
      });
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du profil:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new AuthController();
