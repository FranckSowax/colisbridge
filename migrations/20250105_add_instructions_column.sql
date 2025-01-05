-- Add instructions column to parcels table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'parcels' 
        AND column_name = 'instructions'
    ) THEN
        ALTER TABLE parcels
        ADD COLUMN instructions TEXT;
    END IF;
END $$;
