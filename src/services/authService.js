const { supabaseAdmin } = require('../config/supabase');
const logger = require('../utils/logger');

class AuthService {
  async signUp(email, password, userData) {
    try {
      // Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) throw authError;

      // Ajouter les informations supplémentaires dans la table profiles
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert([{
          id: authData.user.id,
          email: email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          whatsapp_number: userData.whatsappNumber,
          manychat_subscriber_id: userData.manychatSubscriberId,
          role: userData.role || 'client',
          status: 'active'
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      return { user: authData.user, profile: profileData };
    } catch (error) {
      logger.error('Erreur lors de l\'inscription:', error);
      throw error;
    }
  }

  async signIn(email, password) {
    try {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Récupérer le profil complet
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      return { ...data, profile };
    } catch (error) {
      logger.error('Erreur lors de la connexion:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  }

  async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();
