-- Index sur created_by pour les requêtes filtrées par utilisateur
CREATE INDEX IF NOT EXISTS idx_parcels_created_by ON parcels(created_by);

-- Index sur recipient_id pour les jointures avec la table recipients
CREATE INDEX IF NOT EXISTS idx_parcels_recipient_id ON parcels(recipient_id);

-- Index sur tracking_number pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_parcels_tracking_number ON parcels(tracking_number);

-- Index sur status pour les filtres par statut
CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);

-- Index composite pour les requêtes courantes
CREATE INDEX IF NOT EXISTS idx_parcels_created_by_status ON parcels(created_by, status);
