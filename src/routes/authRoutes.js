const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    res.json({
      user: data.user,
      session: data.session
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(401).json({
      error: 'Erreur de connexion',
      message: error.message
    });
  }
});

// Route d'inscription
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) throw error;

    res.json({
      user: data.user,
      session: data.session
    });
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    res.status(400).json({
      error: 'Erreur d\'inscription',
      message: error.message
    });
  }
});

// Route de déconnexion
router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Erreur de déconnexion:', error);
    res.status(500).json({
      error: 'Erreur de déconnexion',
      message: error.message
    });
  }
});

// Route pour récupérer l'utilisateur actuel
router.get('/me', async (req, res) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;

    if (!session) {
      return res.status(401).json({
        error: 'Non authentifié',
        message: 'Aucune session active'
      });
    }

    res.json({
      user: session.user
    });
  } catch (error) {
    console.error('Erreur de récupération utilisateur:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

module.exports = router;
