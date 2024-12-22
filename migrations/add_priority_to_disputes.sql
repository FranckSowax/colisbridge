-- Add priority column to disputes table
ALTER TABLE disputes
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal'
CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Add comment to explain the priority levels
COMMENT ON COLUMN disputes.priority IS 'Niveau de priorité du litige: low, normal, high, urgent';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_disputes_priority ON disputes(priority);

-- Set default priority for existing disputes
UPDATE disputes
SET priority = 'normal'
WHERE priority IS NULL;
