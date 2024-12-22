-- Création des types énumérés s'ils n'existent pas
DO $$ BEGIN
    CREATE TYPE shipping_type_enum AS ENUM ('standard', 'express', 'maritime');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE destination_country_enum AS ENUM ('Gabon', 'Togo', 'Côte d''Ivoire', 'France', 'Dubaï');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE parcel_status_enum AS ENUM ('recu', 'en_preparation', 'en_transit', 'livre', 'annule');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Désactiver les triggers existants
DROP TRIGGER IF EXISTS update_parcels_updated_at ON parcels;

-- Supprimer les tables temporaires si elles existent
DROP TABLE IF EXISTS temp_parcels;

-- Créer une table temporaire simple
CREATE TABLE temp_parcels AS
SELECT 
    p.*
FROM parcels p;

-- Ajouter les colonnes manquantes si nécessaire
DO $$
BEGIN
    -- Ajouter destination_country s'il n'existe pas
    BEGIN
        ALTER TABLE temp_parcels ADD COLUMN destination_country TEXT DEFAULT 'France';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    -- Ajouter shipping_type s'il n'existe pas
    BEGIN
        ALTER TABLE temp_parcels ADD COLUMN shipping_type TEXT DEFAULT 'standard';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    -- Ajouter status s'il n'existe pas
    BEGIN
        ALTER TABLE temp_parcels ADD COLUMN status TEXT DEFAULT 'recu';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- Supprimer les tables existantes
DROP TABLE IF EXISTS parcels CASCADE;
DROP TABLE IF EXISTS recipients CASCADE;

-- Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Création de la table recipients
CREATE TABLE recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(phone, created_by)
);

-- Migration des données clients vers recipients
INSERT INTO recipients (name, phone, email, created_by)
SELECT DISTINCT 
    recipient_name,
    CONCAT('+', FLOOR(RANDOM() * 9000000000 + 1000000000)::TEXT) as phone,  -- Génère un numéro de téléphone aléatoire temporaire
    NULL as email,
    created_by
FROM temp_parcels
WHERE recipient_name IS NOT NULL
ON CONFLICT (phone, created_by) DO NOTHING;

-- Création de la table parcels
CREATE TABLE parcels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_number TEXT UNIQUE NOT NULL,
    recipient_id UUID REFERENCES recipients(id) ON DELETE RESTRICT NOT NULL,
    recipient_name TEXT,
    destination_country TEXT NOT NULL DEFAULT 'France',
    shipping_type TEXT NOT NULL DEFAULT 'standard',
    weight DECIMAL(10,2),
    dimensions TEXT,
    status TEXT NOT NULL DEFAULT 'recu',
    shipping_date TIMESTAMP WITH TIME ZONE,
    photo_urls TEXT[],
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Ajouter la contrainte de vérification pour le statut
ALTER TABLE parcels 
ADD CONSTRAINT valid_status 
CHECK (status IN ('recu', 'expedie', 'receptionne', 'termine', 'litige'));

-- Ajouter la contrainte de vérification pour le type d'expédition
ALTER TABLE parcels 
ADD CONSTRAINT valid_shipping_type 
CHECK (shipping_type IN ('standard', 'express', 'maritime'));

-- Migration des données vers la nouvelle structure
INSERT INTO parcels (
    tracking_number,
    recipient_id,
    recipient_name,
    destination_country,
    shipping_type,
    weight,
    dimensions,
    status,
    shipping_date,
    photo_urls,
    instructions,
    created_at,
    updated_at,
    created_by
)
SELECT 
    CONCAT('CB', TO_CHAR(NOW(), 'YYYYMMDD'), LPAD(CAST(ROW_NUMBER() OVER (ORDER BY p.created_at) AS TEXT), 3, '0')) as tracking_number,
    r.id as recipient_id,
    p.recipient_name,
    p.destination_country,
    p.shipping_type,
    p.weight,
    p.dimensions,
    p.status,
    NULL as shipping_date,
    p.photo_urls,
    p.instructions,
    COALESCE(p.created_at, NOW()),
    COALESCE(p.updated_at, NOW()),
    p.created_by
FROM temp_parcels p
JOIN recipients r ON r.name = p.recipient_name AND r.created_by = p.created_by
WHERE p.recipient_name IS NOT NULL;

-- Nettoyage
DROP TABLE IF EXISTS temp_parcels;

-- Création du trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_parcels_updated_at
    BEFORE UPDATE ON parcels
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Configuration des politiques RLS
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- Politiques pour recipients
DROP POLICY IF EXISTS "Users can view their own recipients" ON recipients;
DROP POLICY IF EXISTS "Users can insert their own recipients" ON recipients;
DROP POLICY IF EXISTS "Users can update their own recipients" ON recipients;

CREATE POLICY "Users can view their own recipients"
    ON recipients FOR SELECT
    USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own recipients"
    ON recipients FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own recipients"
    ON recipients FOR UPDATE
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Politiques pour parcels
DROP POLICY IF EXISTS "Users can view their own parcels" ON parcels;
DROP POLICY IF EXISTS "Users can insert their own parcels" ON parcels;
DROP POLICY IF EXISTS "Users can update their own parcels" ON parcels;

CREATE POLICY "Users can view their own parcels"
    ON parcels FOR SELECT
    USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own parcels"
    ON parcels FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own parcels"
    ON parcels FOR UPDATE
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Configuration de Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE recipients;
ALTER PUBLICATION supabase_realtime ADD TABLE parcels;
