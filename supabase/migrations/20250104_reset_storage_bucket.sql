-- Supprimer toutes les politiques existantes du bucket
DROP POLICY IF EXISTS "Authenticated users can upload parcel photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own parcel photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own parcel photos" ON storage.objects;

-- Supprimer tous les fichiers du bucket
DELETE FROM storage.objects WHERE bucket_id = 'parcel-photos';

-- Recréer les politiques avec les bonnes permissions
CREATE POLICY "Authenticated users can upload parcel photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'parcel-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own parcel photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'parcel-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own parcel photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'parcel-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Vider la table parcel_photos
TRUNCATE TABLE parcel_photos CASCADE;
