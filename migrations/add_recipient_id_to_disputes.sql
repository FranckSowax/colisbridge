-- Drop existing foreign key if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'disputes_recipient_id_fkey'
        AND table_name = 'disputes'
    ) THEN
        ALTER TABLE disputes DROP CONSTRAINT disputes_recipient_id_fkey;
    END IF;
END $$;

-- Add recipient_id column if it doesn't exist
ALTER TABLE disputes
ADD COLUMN IF NOT EXISTS recipient_id UUID;

-- Add foreign key constraint
ALTER TABLE disputes
ADD CONSTRAINT disputes_recipient_id_fkey
FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_disputes_recipient_id ON disputes(recipient_id);

-- Update existing disputes to link with recipients through parcels
UPDATE disputes d
SET recipient_id = p.recipient_id
FROM parcels p
WHERE d.parcel_id = p.id
AND d.recipient_id IS NULL;
