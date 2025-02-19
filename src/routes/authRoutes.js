const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialisation de Supabase avec gestion d'erreur
let supabase;
try {
  supabase = createClient(
    'https://ayxltzvmpqxtyfvfotxd.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eGx0enZtcHF4dHlmdmZvdHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0Nzk5NjcsImV4cCI6MjA1MDA1NTk2N30.--5nlZFj4yKdBg_X0ked23vvFMsvWdKQ2dNbpJlnq0s'
  );
  console.log('Connexion Supabase établie avec succès');
} catch (error) {
  console.error('Erreur lors de l\'initialisation de Supabase:', error);
  throw error;
}

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
