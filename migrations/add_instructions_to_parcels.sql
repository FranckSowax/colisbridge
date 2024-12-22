-- Add instructions column to parcels table
ALTER TABLE parcels
ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Add default value for existing rows
UPDATE parcels 
SET instructions = '' 
WHERE instructions IS NULL;

-- Add comment to the column
COMMENT ON COLUMN parcels.instructions IS 'Instructions spéciales pour la livraison du colis';
