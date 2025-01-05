-- Synchronisation des données entre les tables parcel et colis

-- 1. Sauvegarde temporaire des données existantes
CREATE TEMP TABLE temp_parcels AS
SELECT * FROM parcels;

-- 2. Mise à jour des colis existants
UPDATE parcels p
SET 
    status = CASE 
        WHEN c.status IS NULL THEN 'recu'
        ELSE c.status 
    END,
    shipping_type = COALESCE(c.shipping_type, p.shipping_type),
    weight = COALESCE(c.weight, p.weight),
    destination_country = COALESCE(c.destination_country, p.destination_country),
    updated_at = TIMEZONE('utc'::text, NOW())
FROM colis c
WHERE p.id = c.parcel_id;

-- 3. Insertion des nouveaux colis
INSERT INTO parcels (
    tracking_number,
    recipient_name,
    recipient_id,
    destination_country,
    shipping_type,
    weight,
    status,
    created_by,
    created_at,
    updated_at
)
SELECT 
    CONCAT('CB', TO_CHAR(NOW(), 'YYYYMMDD'), LPAD(CAST(ROW_NUMBER() OVER (ORDER BY c.created_at) AS TEXT), 3, '0')),
    r.name,
    r.id,
    c.destination_country,
    c.shipping_type,
    c.weight,
    COALESCE(c.status, 'recu'),
    c.created_by,
    c.created_at,
    c.updated_at
FROM colis c
LEFT JOIN recipients r ON r.created_by = c.created_by
WHERE NOT EXISTS (
    SELECT 1 
    FROM parcels p 
    WHERE p.id = c.parcel_id
)
AND r.id IS NOT NULL;

-- 4. Mise à jour des références dans la table colis
UPDATE colis c
SET parcel_id = p.id
FROM parcels p
WHERE c.parcel_id IS NULL
AND c.created_by = p.created_by
AND c.created_at = p.created_at;

-- 5. Vérification et nettoyage
SELECT 
    COUNT(*) as total_parcels,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status,
    COUNT(CASE WHEN recipient_id IS NULL THEN 1 END) as null_recipient
FROM parcels;

-- 6. Mise à jour des contraintes si nécessaire
ALTER TABLE parcels 
DROP CONSTRAINT IF EXISTS valid_status;

ALTER TABLE parcels 
ADD CONSTRAINT valid_status 
CHECK (status IN ('recu', 'expedie', 'receptionne', 'termine', 'litige'));

-- 7. Ajout d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);
CREATE INDEX IF NOT EXISTS idx_parcels_created_by ON parcels(created_by);
CREATE INDEX IF NOT EXISTS idx_parcels_recipient_id ON parcels(recipient_id);
