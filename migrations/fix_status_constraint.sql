-- Drop the existing status constraint if it exists
ALTER TABLE parcels
DROP CONSTRAINT IF EXISTS parcels_status_check;

-- Add the correct status constraint with all possible values
ALTER TABLE parcels
ADD CONSTRAINT parcels_status_check
CHECK (status IN ('recu', 'expedie', 'receptionne', 'termine', 'litige', 'pending', 'in_transit', 'delivered', 'cancelled'));

-- Update any null or invalid status values
UPDATE parcels
SET status = 'recu'
WHERE status IS NULL OR status NOT IN ('recu', 'expedie', 'receptionne', 'termine', 'litige', 'pending', 'in_transit', 'delivered', 'cancelled');

-- Add comment to explain status values
COMMENT ON COLUMN parcels.status IS 'État du colis: recu, expedie, receptionne, termine, litige, pending, in_transit, delivered, cancelled';
