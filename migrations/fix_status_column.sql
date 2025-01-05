-- Désactiver temporairement les triggers
ALTER TABLE parcels DISABLE TRIGGER ALL;

-- Supprimer toutes les contraintes existantes sur la colonne status
DO $$ 
BEGIN
    EXECUTE (
        SELECT string_agg('ALTER TABLE parcels DROP CONSTRAINT ' || quote_ident(conname) || ';', E'\n')
        FROM pg_constraint
        WHERE conrelid = 'parcels'::regclass
        AND conname LIKE '%status%'
    );
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Backup des données existantes avec status
CREATE TEMP TABLE parcels_backup AS 
SELECT id, status FROM parcels;

-- Recréer la colonne status
ALTER TABLE parcels DROP COLUMN IF EXISTS status;
ALTER TABLE parcels ADD COLUMN status text;

-- Mettre à jour la colonne avec les valeurs par défaut
UPDATE parcels SET status = 'recu' WHERE status IS NULL;

-- Restaurer les anciennes valeurs si elles sont valides
UPDATE parcels p
SET status = CASE 
    WHEN b.status IN ('recu', 'expedie', 'receptionne', 'litige', 'termine') THEN b.status
    ELSE 'recu'
END
FROM parcels_backup b
WHERE p.id = b.id;

-- Ajouter la nouvelle contrainte
ALTER TABLE parcels 
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN status SET DEFAULT 'recu',
    ADD CONSTRAINT parcels_status_check 
    CHECK (status IN ('recu', 'expedie', 'receptionne', 'litige', 'termine'));

-- Réactiver les triggers
ALTER TABLE parcels ENABLE TRIGGER ALL;

-- Nettoyer
DROP TABLE parcels_backup;
