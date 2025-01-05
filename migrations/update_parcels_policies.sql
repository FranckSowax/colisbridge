-- Enable RLS
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON parcels;
DROP POLICY IF EXISTS "Enable status update for authenticated users" ON parcels;
DROP POLICY IF EXISTS "Enable disputes access for authenticated users" ON disputes;
DROP POLICY IF EXISTS "Enable monthly revenue access for authenticated users" ON monthly_revenue;

-- Policy pour permettre la lecture des colis à l'utilisateur connecté
CREATE POLICY "Enable read access for authenticated users" ON parcels
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy pour permettre la mise à jour des statuts à l'utilisateur connecté
CREATE POLICY "Enable status update for authenticated users" ON parcels
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy pour les litiges
CREATE POLICY "Enable disputes access for authenticated users" ON disputes
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy pour le CA mensuel
CREATE POLICY "Enable monthly revenue access for authenticated users" ON monthly_revenue
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
