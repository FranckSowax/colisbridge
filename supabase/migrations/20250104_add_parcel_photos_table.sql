-- Drop existing objects if they exist
DROP TABLE IF EXISTS parcel_photos CASCADE;
DROP INDEX IF EXISTS idx_parcel_photos_parcel_id;
DROP FUNCTION IF EXISTS update_parcel_photos_updated_at CASCADE;

-- Create parcel_photos table
CREATE TABLE parcel_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add indexes
CREATE INDEX idx_parcel_photos_parcel_id ON parcel_photos(parcel_id);

-- Add RLS policies
ALTER TABLE parcel_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own parcel photos" ON parcel_photos;
DROP POLICY IF EXISTS "Users can add photos to their own parcels" ON parcel_photos;
DROP POLICY IF EXISTS "Users can delete their own parcel photos" ON parcel_photos;

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

-- Create or replace the update timestamp function
CREATE OR REPLACE FUNCTION update_parcel_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_parcel_photos_updated_at ON parcel_photos;

-- Create trigger
CREATE TRIGGER update_parcel_photos_updated_at
    BEFORE UPDATE ON parcel_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_parcel_photos_updated_at();
