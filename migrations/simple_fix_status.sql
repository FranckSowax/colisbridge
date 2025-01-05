-- Supprimer uniquement la contrainte de status si elle existe
ALTER TABLE parcels DROP CONSTRAINT IF EXISTS parcels_status_check;

-- Mettre à jour tous les statuts null ou invalides à 'recu'
UPDATE parcels 
SET status = 'recu' 
WHERE status IS NULL OR status NOT IN ('recu', 'expedie', 'receptionne', 'litige', 'termine');

-- Ajouter la nouvelle contrainte
ALTER TABLE parcels 
    ALTER COLUMN status SET DEFAULT 'recu',
    ADD CONSTRAINT parcels_status_check 
    CHECK (status IN ('recu', 'expedie', 'receptionne', 'litige', 'termine'));
