-- Création de la table disputes
CREATE TABLE IF NOT EXISTS disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parcel_id UUID REFERENCES parcels(id),
    status VARCHAR(50) DEFAULT 'ouvert',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id)
);

-- Ajouter la politique RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'accès aux utilisateurs authentifiés
CREATE POLICY "Enable full access for authenticated users"
ON disputes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
