-- Ajouter la colonne shipping_date si elle n'existe pas
DO $$
BEGIN
    BEGIN
        ALTER TABLE parcels ADD COLUMN shipping_date TIMESTAMP WITH TIME ZONE;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;
