-- Drop existing policies
DROP POLICY IF EXISTS "Users can view photos of their parcels" ON parcel_photos;
DROP POLICY IF EXISTS "Users can insert photos for their parcels" ON parcel_photos;
DROP POLICY IF EXISTS "Users can update their parcel photos" ON parcel_photos;
DROP POLICY IF EXISTS "Users can delete their parcel photos" ON parcel_photos;

-- Create a temporary policy to allow all authenticated users to insert
CREATE POLICY "Enable insert access for authenticated users" ON parcel_photos
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create policies for other operations
CREATE POLICY "Users can view photos of their parcels" ON parcel_photos
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM parcels
            WHERE parcels.id = parcel_photos.parcel_id
            AND parcels.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update their parcel photos" ON parcel_photos
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM parcels
            WHERE parcels.id = parcel_photos.parcel_id
            AND parcels.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete their parcel photos" ON parcel_photos
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM parcels
            WHERE parcels.id = parcel_photos.parcel_id
            AND parcels.created_by = auth.uid()
        )
    );

-- Storage policies
DROP POLICY IF EXISTS "Users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can read photos" ON storage.objects;

-- Allow authenticated users to upload photos
CREATE POLICY "Users can upload photos" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'parcel-photos');

-- Allow authenticated users to read photos
CREATE POLICY "Users can read photos" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'parcel-photos');
