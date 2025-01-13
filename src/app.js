const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Charger les variables d'environnement
const envPath = path.join(process.cwd(), '.env');
console.log('Tentative de chargement du fichier .env depuis:', envPath);

try {
  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
      process.env[k] = envConfig[k];
    }
    console.log('Variables d\'environnement chargées avec succès');
  } else {
    console.error('Fichier .env non trouvé à:', envPath);
  }
} catch (err) {
  console.error('Erreur lors du chargement du fichier .env:', err);
}

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createClient } = require('@supabase/supabase-js');
const authRoutes = require('./routes/authRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialisation de Supabase avec gestion d'erreur
const supabase = createClient(
  'https://ayxltzvmpqxtyfvfotxd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eGx0enZtcHF4dHlmdmZvdHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0Nzk5NjcsImV4cCI6MjA1MDA1NTk2N30.--5nlZFj4yKdBg_X0ked23vvFMsvWdKQ2dNbpJlnq0s'
);

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route par défaut pour le frontend
app.get('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    message: 'La route demandée n\'existe pas'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Une erreur est survenue !',
    message: err.message
  });
});

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${server.address().port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} est déjà utilisé, tentative sur le port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Erreur du serveur:', err);
    }
  });
};

startServer(port);
