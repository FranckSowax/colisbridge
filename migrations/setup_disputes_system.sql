-- Création du type enum pour le statut des litiges
CREATE TYPE dispute_status AS ENUM ('ouvert', 'en_cours', 'resolu', 'annule');

-- Recréation de la table disputes avec une structure complète
DROP TABLE IF EXISTS disputes CASCADE;
CREATE TABLE disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parcel_id UUID NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
    status dispute_status DEFAULT 'ouvert',
    description TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    priority TEXT DEFAULT 'normale',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    customer_notified BOOLEAN DEFAULT false
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX disputes_parcel_id_idx ON disputes(parcel_id);
CREATE INDEX disputes_status_idx ON disputes(status);
CREATE INDEX disputes_created_at_idx ON disputes(created_at);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_disputes_updated_at
    BEFORE UPDATE ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Enable read access for authenticated users"
ON disputes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON disputes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
ON disputes FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
