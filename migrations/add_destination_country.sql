-- Add destination_country column to parcels table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 
                   FROM information_schema.columns 
                   WHERE table_name='parcels' AND column_name='destination_country') 
    THEN
        ALTER TABLE parcels
        ADD COLUMN destination_country destination_country_enum DEFAULT 'France';
    END IF;
END $$;
