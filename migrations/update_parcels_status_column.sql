-- Add default value to status column
ALTER TABLE parcels 
ALTER COLUMN status SET DEFAULT 'recu';

-- Update existing null values to 'recu'
UPDATE parcels 
SET status = 'recu' 
WHERE status IS NULL;
