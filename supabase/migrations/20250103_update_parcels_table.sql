-- Mise à jour de la table parcels
ALTER TABLE parcels
DROP CONSTRAINT IF EXISTS parcels_status_check;

-- Afficher les statuts distincts existants pour debug
DO $$
BEGIN
    RAISE NOTICE 'Statuts existants : %', (SELECT string_agg(DISTINCT status, ', ') FROM parcels);
END $$;

-- Mise à jour des statuts existants pour correspondre aux nouvelles valeurs
UPDATE parcels SET status = 'Reçu' WHERE status IN ('Recu', 'recu', 'Reçu');
UPDATE parcels SET status = 'Expédié' WHERE status IN ('Expedie', 'expedie', 'Expédie', 'Expédié');
UPDATE parcels SET status = 'Receptionné' WHERE status IN ('Receptionne', 'receptionne', 'Receptionné');
UPDATE parcels SET status = 'Terminé' WHERE status IN ('Termine', 'termine', 'Terminé');
UPDATE parcels SET status = 'Litige' WHERE status IN ('litige', 'Litige');

-- Mise à jour des statuts null ou invalides
UPDATE parcels SET status = 'Reçu' WHERE status IS NULL OR status NOT IN ('Reçu', 'Expédié', 'Receptionné', 'Terminé', 'Litige');

-- Vérifier qu'il n'y a plus de statuts invalides
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM parcels 
        WHERE status NOT IN ('Reçu', 'Expédié', 'Receptionné', 'Terminé', 'Litige')
    ) THEN
        RAISE NOTICE 'Statuts invalides restants : %', 
            (SELECT string_agg(DISTINCT status, ', ') 
             FROM parcels 
             WHERE status NOT IN ('Reçu', 'Expédié', 'Receptionné', 'Terminé', 'Litige'));
    END IF;
END $$;

-- Suppression des anciennes politiques
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON parcels;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON parcels;
DROP POLICY IF EXISTS "Enable update for owners and admins" ON parcels;

-- Ajout des colonnes nécessaires s'ils n'existent pas déjà
ALTER TABLE parcels
ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS destination_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS total_price DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Reçu',
ADD COLUMN IF NOT EXISTS has_dispute BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dispute_id UUID REFERENCES disputes(id),
ADD COLUMN IF NOT EXISTS sent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Ajout de la contrainte pour le statut
ALTER TABLE parcels
ADD CONSTRAINT parcels_status_check 
CHECK (status IN ('Reçu', 'En cours', 'Expédié', 'Litige', 'Terminé'));

-- Création des index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_parcels_destination_country ON parcels(destination_country);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);
CREATE INDEX IF NOT EXISTS idx_parcels_has_dispute ON parcels(has_dispute);
CREATE INDEX IF NOT EXISTS idx_parcels_dispute_id ON parcels(dispute_id);
CREATE INDEX IF NOT EXISTS idx_parcels_created_by ON parcels(created_by);

-- Fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement updated_at
DROP TRIGGER IF EXISTS update_parcels_updated_at ON parcels;
CREATE TRIGGER update_parcels_updated_at
    BEFORE UPDATE ON parcels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Activation de la sécurité niveau ligne
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- Politique pour la lecture des colis
CREATE POLICY "Enable read access for authenticated users" ON parcels
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Politique pour la création des colis
CREATE POLICY "Enable insert for authenticated users" ON parcels
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Politique pour la mise à jour des colis
CREATE POLICY "Enable update for authenticated users" ON parcels
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Fonction pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_user_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip statistics update for now to debug the parcel update issue
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les statistiques
DROP TRIGGER IF EXISTS update_user_statistics ON parcels;
CREATE TRIGGER update_user_statistics
    AFTER INSERT ON parcels
    FOR EACH ROW
    EXECUTE FUNCTION update_user_statistics();
