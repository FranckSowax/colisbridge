-- Supprimer la table disputes si elle existe
DROP TABLE IF EXISTS disputes CASCADE;

-- Recréer la table disputes avec une structure simplifiée
CREATE TABLE disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parcel_id UUID NOT NULL,
    status TEXT DEFAULT 'ouvert',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE
);

-- Activer RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON disputes;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON disputes;

-- Créer de nouvelles politiques simples
CREATE POLICY "Enable read access for authenticated users" 
ON disputes FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable write access for authenticated users" 
ON disputes FOR INSERT 
TO authenticated 
WITH CHECK (true);
