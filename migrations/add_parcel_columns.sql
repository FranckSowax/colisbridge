-- Ajout des colonnes sans contraintes
ALTER TABLE parcels
ADD COLUMN IF NOT EXISTS dimensions TEXT,
ADD COLUMN IF NOT EXISTS shipping_type TEXT,
ADD COLUMN IF NOT EXISTS destination_country TEXT,
ADD COLUMN IF NOT EXISTS photo_urls TEXT[],
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Mise à jour des données existantes
UPDATE parcels 
SET shipping_type = 'standard',
    destination_country = 'France'
WHERE shipping_type IS NULL 
   OR destination_country IS NULL;

-- Création des types énumérés
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

-- Conversion des colonnes en types énumérés
ALTER TABLE parcels
ALTER COLUMN shipping_type TYPE shipping_type_enum USING shipping_type::shipping_type_enum,
ALTER COLUMN destination_country TYPE destination_country_enum USING destination_country::destination_country_enum;

-- Ajout des contraintes NOT NULL
ALTER TABLE parcels
ALTER COLUMN shipping_type SET NOT NULL,
ALTER COLUMN destination_country SET NOT NULL;
