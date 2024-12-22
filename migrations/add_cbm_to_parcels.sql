-- Add CBM (Cubic Meter) column to parcels table
ALTER TABLE parcels
ADD COLUMN IF NOT EXISTS cbm DECIMAL(10,2);

-- Add constraint to ensure CBM is positive
ALTER TABLE parcels
ADD CONSTRAINT check_cbm_positive CHECK (cbm >= 0);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_parcels_cbm ON parcels(cbm);
