-- Enable storage if not already enabled
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA "extensions";

-- Note: Le bucket de stockage doit être créé manuellement via l'interface Supabase
-- 1. Aller dans Storage dans le dashboard Supabase
-- 2. Créer un nouveau bucket nommé 'parcel-photos'
-- 3. Cocher 'Public bucket' pour permettre l'accès public aux fichiers
-- 4. Dans les politiques, ajouter :
--    - SELECT pour authenticated
--    - INSERT pour authenticated
--    - DELETE pour authenticated avec la condition auth.uid() = storage.foldername(name)[1]

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload parcel photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'parcel-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own photos
CREATE POLICY "Users can view their own parcel photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'parcel-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own parcel photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'parcel-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Créer la table pour stocker les références aux photos
CREATE TABLE IF NOT EXISTS parcel_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add indexes
CREATE INDEX idx_parcel_photos_parcel_id ON parcel_photos(parcel_id);

-- Add RLS policies
ALTER TABLE parcel_photos ENABLE ROW LEVEL SECURITY;

-- Policy to view photos (users can only view photos of their own parcels)
CREATE POLICY "Users can view their own parcel photos"
    ON parcel_photos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM parcels
            WHERE parcels.id = parcel_photos.parcel_id
            AND parcels.created_by = auth.uid()
        )
    );

-- Policy to insert photos (users can only add photos to their own parcels)
CREATE POLICY "Users can add photos to their own parcels"
    ON parcel_photos
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM parcels
            WHERE parcels.id = parcel_photos.parcel_id
            AND parcels.created_by = auth.uid()
        )
    );

-- Policy to delete photos (users can only delete photos from their own parcels)
CREATE POLICY "Users can delete their own parcel photos"
    ON parcel_photos
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM parcels
            WHERE parcels.id = parcel_photos.parcel_id
            AND parcels.created_by = auth.uid()
        )
    );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_parcel_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_parcel_photos_updated_at
    BEFORE UPDATE ON parcel_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_parcel_photos_updated_at();
