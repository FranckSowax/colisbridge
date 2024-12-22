-- Drop existing constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'parcels_recipient_id_fkey'
        AND table_name = 'parcels'
    ) THEN
        ALTER TABLE parcels DROP CONSTRAINT parcels_recipient_id_fkey;
    END IF;
END $$;

-- Add recipient_id column if it doesn't exist
ALTER TABLE parcels
ADD COLUMN IF NOT EXISTS recipient_id UUID;

-- Add foreign key constraint
ALTER TABLE parcels
ADD CONSTRAINT parcels_recipient_id_fkey
FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE SET NULL;

-- Create index for better performance
DROP INDEX IF EXISTS idx_parcels_recipient_id;
CREATE INDEX idx_parcels_recipient_id ON parcels(recipient_id);

-- Add comment
COMMENT ON COLUMN parcels.recipient_id IS 'ID du destinataire du colis';
