-- Add resolution_deadline column to disputes table
ALTER TABLE disputes
ADD COLUMN IF NOT EXISTS resolution_deadline TIMESTAMP WITH TIME ZONE;

-- Add constraint to ensure resolution_deadline is in the future
ALTER TABLE disputes
ADD CONSTRAINT check_resolution_deadline_future
CHECK (resolution_deadline > created_at);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_disputes_resolution_deadline ON disputes(resolution_deadline);

-- Add comment
COMMENT ON COLUMN disputes.resolution_deadline IS 'Date limite pour la résolution du litige';

-- Set default deadline (7 days from creation) for existing disputes
UPDATE disputes
SET resolution_deadline = created_at + INTERVAL '7 days'
WHERE resolution_deadline IS NULL;
