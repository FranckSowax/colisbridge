-- Drop les anciennes contraintes et triggers
DROP TRIGGER IF EXISTS create_dispute_notification ON disputes;
DROP FUNCTION IF EXISTS create_dispute_notification CASCADE;
DROP TRIGGER IF EXISTS set_resolution_deadline ON disputes;
DROP FUNCTION IF EXISTS set_resolution_deadline CASCADE;
DROP TRIGGER IF EXISTS set_default_title ON disputes;
DROP FUNCTION IF EXISTS set_default_title CASCADE;
DROP TRIGGER IF EXISTS set_default_priority ON disputes;
DROP FUNCTION IF EXISTS set_default_priority CASCADE;

-- Supprime les anciennes contraintes et politiques
DROP POLICY IF EXISTS "Enable read for users" ON disputes;
DROP POLICY IF EXISTS "Enable insert for users" ON disputes;
DROP POLICY IF EXISTS "Enable update for users" ON disputes;

-- Suppression des anciennes tables et contraintes
DROP TABLE IF EXISTS disputes CASCADE;

-- Création de la table disputes simplifiée
CREATE TABLE disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    reason VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Litige',
    priority VARCHAR(20) DEFAULT 'medium',
    parcel_id UUID REFERENCES parcels(id),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Index essentiels
CREATE INDEX IF NOT EXISTS idx_disputes_parcel ON disputes(parcel_id);
CREATE INDEX IF NOT EXISTS idx_disputes_created_by ON disputes(created_by);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

-- Fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER set_disputes_updated_at
    BEFORE UPDATE ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION update_disputes_updated_at();

-- Activation de la sécurité niveau ligne
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Politiques RLS simplifiées
CREATE POLICY "Enable read access for all authenticated users" ON disputes
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON disputes
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON disputes
    FOR UPDATE
    USING (
        auth.uid() = created_by OR
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );
