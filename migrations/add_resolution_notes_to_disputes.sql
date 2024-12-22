-- Add resolution_notes column to disputes table
ALTER TABLE disputes
ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN disputes.resolution_notes IS 'Notes détaillées concernant la résolution du litige';

-- Migrate existing resolution data if needed
UPDATE disputes
SET resolution_notes = resolution
WHERE resolution_notes IS NULL AND resolution IS NOT NULL;
