-- Add cbm column to parcels table if it doesn't exist
DO $$ 
BEGIN
    ALTER TABLE parcels ADD COLUMN cbm DECIMAL(10,2);
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;
