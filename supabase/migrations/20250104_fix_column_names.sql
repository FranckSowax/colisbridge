-- Renommer les colonnes dans la table parcels pour uniformisation
ALTER TABLE parcels
    -- Renommer les colonnes liées au pays
    DROP CONSTRAINT IF EXISTS parcels_status_check CASCADE;

-- Recréer la table parcels avec les bons noms de colonnes
DROP TABLE IF EXISTS parcels CASCADE;
CREATE TABLE parcels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Reçu',
    
    -- Informations du destinataire
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    
    -- Informations de livraison
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    address TEXT,
    postal_code VARCHAR(20),
    
    -- Informations du colis
    weight DECIMAL(10,2),
    dimensions VARCHAR(50),
    description TEXT,
    
    -- Informations financières
    total_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Dates importantes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_date TIMESTAMP WITH TIME ZONE,
    estimated_delivery_date TIMESTAMP WITH TIME ZONE,
    delivered_date TIMESTAMP WITH TIME ZONE,
    
    -- Relations et flags
    created_by UUID NOT NULL,
    client_id UUID REFERENCES clients(id),
    client_reference VARCHAR(100),
    has_dispute BOOLEAN DEFAULT FALSE,
    
    -- Contraintes
    CONSTRAINT parcels_status_check CHECK (
        status IN ('Reçu', 'En cours', 'Expédié', 'Litige', 'Terminé')
    )
);

-- Recréer les index
CREATE INDEX idx_parcels_tracking ON parcels(tracking_number);
CREATE INDEX idx_parcels_status ON parcels(status);
CREATE INDEX idx_parcels_created_by ON parcels(created_by);
CREATE INDEX idx_parcels_country ON parcels(country);
CREATE INDEX idx_parcels_client ON parcels(client_id);

-- Mettre à jour la fonction create_parcel pour utiliser les nouveaux noms de colonnes
CREATE OR REPLACE FUNCTION create_parcel(
    -- Paramètres obligatoires en premier
    p_name VARCHAR,
    p_phone VARCHAR,
    p_country VARCHAR,
    p_created_by UUID,
    
    -- Paramètres optionnels ensuite
    p_email VARCHAR DEFAULT NULL,
    p_city VARCHAR DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_postal_code VARCHAR DEFAULT NULL,
    p_weight DECIMAL DEFAULT 0,
    p_dimensions VARCHAR DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_client_id UUID DEFAULT NULL,
    p_client_reference VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    parcel_id UUID,
    tracking_number VARCHAR,
    shipping_cost DECIMAL,
    total_price DECIMAL,
    estimated_delivery_date TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_parcel_id UUID;
    v_tracking_number VARCHAR;
    v_shipping_cost DECIMAL;
    v_total_price DECIMAL;
    v_estimated_delivery_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Générer le numéro de suivi
    v_tracking_number := 'CB-' || 
                        TO_CHAR(CURRENT_DATE, 'YY') || '-' ||
                        LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Calculer les coûts
    v_shipping_cost := CASE p_country
        WHEN 'France' THEN 10
        WHEN 'Belgique' THEN 15
        WHEN 'Suisse' THEN 20
        ELSE 30
    END + COALESCE(p_weight, 0) * 2;
    
    v_total_price := v_shipping_cost;
    
    -- Calculer la date de livraison estimée
    v_estimated_delivery_date := CASE p_country
        WHEN 'France' THEN CURRENT_TIMESTAMP + interval '3 days'
        WHEN 'Belgique' THEN CURRENT_TIMESTAMP + interval '4 days'
        WHEN 'Suisse' THEN CURRENT_TIMESTAMP + interval '5 days'
        ELSE CURRENT_TIMESTAMP + interval '7 days'
    END;

    -- Insérer le nouveau colis
    INSERT INTO parcels (
        tracking_number,
        status,
        name,
        phone,
        email,
        country,
        city,
        address,
        postal_code,
        weight,
        dimensions,
        description,
        shipping_cost,
        total_price,
        created_by,
        client_id,
        client_reference,
        estimated_delivery_date
    ) VALUES (
        v_tracking_number,
        'Reçu',
        p_name,
        p_phone,
        p_email,
        p_country,
        p_city,
        p_address,
        p_postal_code,
        p_weight,
        p_dimensions,
        p_description,
        v_shipping_cost,
        v_total_price,
        p_created_by,
        p_client_id,
        p_client_reference,
        v_estimated_delivery_date
    )
    RETURNING id INTO v_parcel_id;

    -- Retourner les informations du colis créé
    RETURN QUERY
    SELECT 
        v_parcel_id,
        v_tracking_number,
        v_shipping_cost,
        v_total_price,
        v_estimated_delivery_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activer RLS
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- Recréer les politiques RLS
CREATE POLICY "Enable read access for authenticated users" ON parcels
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON parcels
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        auth.uid() = created_by
    );

CREATE POLICY "Enable update for owners and admins" ON parcels
    FOR UPDATE
    USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND 
            raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Commentaire d'aide pour l'utilisation
COMMENT ON FUNCTION create_parcel IS 'Créer un nouveau colis. Exemple d''utilisation:
SELECT * FROM create_parcel(
    ''John Doe'',         -- name
    ''+33123456789'',    -- phone
    ''France'',          -- country
    auth.uid(),          -- created_by
    ''john@example.com'', -- email
    ''Paris'',           -- city
    ''123 Rue Example'', -- address
    ''75001'',           -- postal_code
    2.5,                -- weight
    ''30x20x15'',       -- dimensions
    ''Fragile'',        -- description
    NULL,               -- client_id (optionnel)
    ''REF123'',         -- client_reference (optionnel)
);';
