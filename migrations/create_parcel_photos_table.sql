-- Create parcel_photos table
CREATE TABLE IF NOT EXISTS parcel_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
    photo_path TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies
ALTER TABLE parcel_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view photos of their parcels" ON parcel_photos;
DROP POLICY IF EXISTS "Users can insert photos for their parcels" ON parcel_photos;
DROP POLICY IF EXISTS "Users can update their parcel photos" ON parcel_photos;
DROP POLICY IF EXISTS "Users can delete their parcel photos" ON parcel_photos;

-- Policy for select (read)
CREATE POLICY "Users can view photos of their parcels" ON parcel_photos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM parcels
            WHERE parcels.id = parcel_photos.parcel_id
            AND parcels.created_by = auth.uid()
        )
    );

-- Policy for insert
CREATE POLICY "Users can insert photos for their parcels" ON parcel_photos
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM parcels
            WHERE parcels.id = parcel_photos.parcel_id
            AND parcels.created_by = auth.uid()
        )
    );

-- Policy for update
CREATE POLICY "Users can update their parcel photos" ON parcel_photos
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM parcels
            WHERE parcels.id = parcel_photos.parcel_id
            AND parcels.created_by = auth.uid()
        )
    );

-- Policy for delete
CREATE POLICY "Users can delete their parcel photos" ON parcel_photos
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM parcels
            WHERE parcels.id = parcel_photos.parcel_id
            AND parcels.created_by = auth.uid()
        )
    );

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_parcel_photos_updated_at ON parcel_photos;
DROP FUNCTION IF EXISTS update_parcel_photos_updated_at();

-- Create trigger for updated_at
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

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_parcel_photos_parcel_id;
DROP INDEX IF EXISTS idx_parcel_photos_created_at;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_parcel_photos_parcel_id ON parcel_photos(parcel_id);
CREATE INDEX IF NOT EXISTS idx_parcel_photos_created_at ON parcel_photos(created_at);
