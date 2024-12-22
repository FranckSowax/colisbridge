-- Add destination_country column to parcels table
ALTER TABLE parcels
ADD COLUMN IF NOT EXISTS destination_country TEXT;

-- Add constraint to ensure destination_country is one of the allowed values
ALTER TABLE parcels
ADD CONSTRAINT check_valid_destination_country 
CHECK (destination_country IN ('France', 'Gabon', 'Togo', 'Côte d''Ivoire', 'Dubai'));

-- Set default value for existing rows
UPDATE parcels 
SET destination_country = 'France' 
WHERE destination_country IS NULL;
