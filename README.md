# ColisBridge

Application de gestion de colis transfrontaliers entre la Chine et l'Afrique.

## Fonctionnalités

- Suivi en temps réel des colis
- Notifications WhatsApp automatiques
- Tableau de bord administrateur
- Gestion des clients
- Interface responsive et moderne

## Prérequis

- Node.js >= 16
- MySQL >= 8.0
- npm >= 8.0

## Installation

1. Cloner le repository
```bash
git clone [URL_DU_REPO]
cd colisbridge
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env
# Éditer le fichier .env avec vos configurations
```

4. Démarrer l'application
```bash
npm run dev
```

## Structure du Projet

```
colisbridge/
├── src/
│   ├── app.js           # Point d'entrée de l'application
│   ├── config/          # Configuration (base de données, etc.)
│   ├── controllers/     # Contrôleurs
│   ├── models/         # Modèles Sequelize
│   ├── routes/         # Routes API
│   ├── middlewares/    # Middlewares personnalisés
│   ├── services/       # Services métier
│   └── utils/          # Utilitaires
├── public/             # Fichiers statiques
├── tests/             # Tests
└── docs/              # Documentation
```

## Technologies Utilisées

- Backend: Node.js, Express.js
- Base de données: MySQL avec Sequelize
- Authentication: JWT
- Frontend: HTML5, CSS3, Bootstrap 5
- Notifications: API WhatsApp Business/Twilio
- Tests: Jest, Cypress

## Licence

Propriétaire - Tous droits réservés
