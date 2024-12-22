-- Création du bucket parcel-photos s'il n'existe pas
INSERT INTO storage.buckets (id, name)
SELECT 'parcel-photos', 'parcel-photos'
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'parcel-photos'
);

-- Configuration des politiques pour le bucket parcel-photos
-- Politique de lecture : tout utilisateur authentifié peut lire les fichiers
CREATE POLICY "Authenticated users can read parcel photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'parcel-photos');

-- Politique d'insertion : les utilisateurs peuvent uploader dans leur propre dossier
CREATE POLICY "Users can upload parcel photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'parcel-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);
