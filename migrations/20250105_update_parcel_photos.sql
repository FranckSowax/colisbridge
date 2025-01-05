-- Update parcel_photos table structure
ALTER TABLE parcel_photos
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS url TEXT;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view photos of their parcels" ON parcel_photos;
DROP POLICY IF EXISTS "Users can insert photos for their parcels" ON parcel_photos;
DROP POLICY IF EXISTS "Users can update their parcel photos" ON parcel_photos;
DROP POLICY IF EXISTS "Users can delete their parcel photos" ON parcel_photos;

-- Create more permissive policies
CREATE POLICY "Users can view photos of their parcels" ON parcel_photos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM parcels
            WHERE parcels.id = parcel_photos.parcel_id
            AND parcels.created_by = auth.uid()
        )
    );

-- Allow users to insert photos for parcels they own
CREATE POLICY "Users can insert photos for their parcels" ON parcel_photos
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM parcels
            WHERE parcels.id = parcel_photos.parcel_id
            AND parcels.created_by = auth.uid()
        )
        OR 
        -- Allow insert during parcel creation
        EXISTS (
            SELECT 1 FROM parcels
            WHERE parcels.id = parcel_photos.parcel_id
            AND parcels.created_at >= (NOW() - interval '5 minutes')
            AND parcels.created_by = auth.uid()
        )
    );

-- Allow users to update their own photos
CREATE POLICY "Users can update their parcel photos" ON parcel_photos
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM parcels
            WHERE parcels.id = parcel_photos.parcel_id
            AND parcels.created_by = auth.uid()
        )
    );

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their parcel photos" ON parcel_photos
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM parcels
            WHERE parcels.id = parcel_photos.parcel_id
            AND parcels.created_by = auth.uid()
        )
    );

-- Create storage policy for uploading photos
DROP POLICY IF EXISTS "Users can upload photos" ON storage.objects;

CREATE POLICY "Users can upload photos" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'parcel-photos' AND
        (
            EXISTS (
                SELECT 1 FROM parcels
                WHERE parcels.id::text = split_part(name, '/', 1)
                AND parcels.created_by = auth.uid()
            )
        )
    );
