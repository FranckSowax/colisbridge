-- Création du type enum pour les statuts si il n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'parcel_status') THEN
        CREATE TYPE parcel_status AS ENUM ('recu', 'expedie', 'receptionne', 'litige', 'termine');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Création de la table monthly_revenue si elle n'existe pas
CREATE TABLE IF NOT EXISTS monthly_revenue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month_year VARCHAR(7) NOT NULL UNIQUE,
    amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Création de la table disputes si elle n'existe pas
CREATE TABLE IF NOT EXISTS disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parcel_id UUID REFERENCES parcels(id),
    status VARCHAR(50) DEFAULT 'ouvert',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Ajout des colonnes de dates et mise à jour de la colonne status dans la table parcels
DO $$ 
BEGIN 
    -- Ajout des colonnes de dates
    BEGIN
        ALTER TABLE parcels ADD COLUMN shipping_date TIMESTAMP WITH TIME ZONE;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE parcels ADD COLUMN reception_date TIMESTAMP WITH TIME ZONE;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE parcels ADD COLUMN completion_date TIMESTAMP WITH TIME ZONE;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    -- Mise à jour de la colonne status
    BEGIN
        -- Supprimer l'ancienne contrainte si elle existe
        ALTER TABLE parcels DROP CONSTRAINT IF EXISTS parcels_status_check;
        
        -- Mettre à jour la colonne status avec les valeurs autorisées
        ALTER TABLE parcels 
        ALTER COLUMN status SET DEFAULT 'recu',
        ADD CONSTRAINT parcels_status_check 
        CHECK (status IN ('recu', 'expedie', 'receptionne', 'litige', 'termine'));
    EXCEPTION
        WHEN others THEN NULL;
    END;
END $$;

-- Enable RLS sur toutes les tables
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON parcels;
DROP POLICY IF EXISTS "Enable status update for authenticated users" ON parcels;
DROP POLICY IF EXISTS "Enable disputes access for authenticated users" ON disputes;
DROP POLICY IF EXISTS "Enable monthly revenue access for authenticated users" ON monthly_revenue;

-- Recréer les politiques
-- Policies pour parcels
CREATE POLICY "Enable read access for authenticated users" ON parcels
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable status update for authenticated users" ON parcels
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policies pour disputes
CREATE POLICY "Enable disputes access for authenticated users" ON disputes
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policies pour monthly_revenue
CREATE POLICY "Enable monthly revenue access for authenticated users" ON monthly_revenue
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
