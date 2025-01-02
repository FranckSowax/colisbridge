-- Fonction pour synchroniser les photos des colis
CREATE OR REPLACE FUNCTION sync_parcel_photos()
RETURNS void AS $$
BEGIN
    -- Mettre à jour les URLs des photos pour les colis qui n'en ont pas encore
    UPDATE public.parcels
    SET photo_urls = ARRAY[
        ('https://ayxltzvmpqxtyfvfotxd.supabase.co/storage/v1/object/public/parcel-photos/' || tracking_number || '_1.jpg')::text,
        ('https://ayxltzvmpqxtyfvfotxd.supabase.co/storage/v1/object/public/parcel-photos/' || tracking_number || '_2.jpg')::text,
        ('https://ayxltzvmpqxtyfvfotxd.supabase.co/storage/v1/object/public/parcel-photos/' || tracking_number || '_3.jpg')::text
    ]::text[]
    WHERE photo_urls IS NULL OR photo_urls = ARRAY[]::text[] OR photo_urls = '{}'::text[];

    -- Afficher les colis mis à jour
    RAISE NOTICE 'Photos synchronisées pour les colis';
END;
$$ LANGUAGE plpgsql;

-- Exécuter la fonction
SELECT sync_parcel_photos();

-- Vérifier les résultats
SELECT 
    tracking_number,
    destination_country,
    photo_urls,
    created_at
FROM 
    public.parcels
WHERE 
    photo_urls IS NOT NULL 
    AND photo_urls != ARRAY[]::text[]
    AND photo_urls != '{}'::text[]
ORDER BY 
    created_at DESC;
