-- Suppression de toutes les versions existantes de la fonction
DROP FUNCTION IF EXISTS create_parcel(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, DECIMAL, VARCHAR, TEXT, UUID, VARCHAR, UUID);
DROP FUNCTION IF EXISTS create_parcel(VARCHAR, VARCHAR, VARCHAR, UUID, VARCHAR, VARCHAR, TEXT, VARCHAR, DECIMAL, VARCHAR, TEXT, UUID, VARCHAR);
DROP FUNCTION IF EXISTS create_parcel(VARCHAR, VARCHAR, VARCHAR, UUID);

-- Suppression de la table existante
DROP TABLE IF EXISTS parcels CASCADE;

-- Recréation de la table avec les noms de colonnes exacts
CREATE TABLE parcels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Reçu',
    
    -- Informations du destinataire
    recipient_id UUID DEFAULT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255),
    recipient_address TEXT,
    
    -- Informations de livraison
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    shipping_type VARCHAR(50) DEFAULT 'Standard',
    
    -- Informations du colis
    weight DECIMAL(10,2) DEFAULT 0,
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
    
    CONSTRAINT parcels_status_check CHECK (
        status IN ('Reçu', 'En cours', 'Expédié', 'Litige', 'Terminé')
    ),
    CONSTRAINT parcels_shipping_type_check CHECK (
        shipping_type IN ('Standard', 'Express', 'Maritime')
    )
);

-- Recréation des index
CREATE INDEX idx_parcels_tracking ON parcels(tracking_number);
CREATE INDEX idx_parcels_status ON parcels(status);
CREATE INDEX idx_parcels_created_by ON parcels(created_by);
CREATE INDEX idx_parcels_country ON parcels(country);
CREATE INDEX idx_parcels_client ON parcels(client_id);
CREATE INDEX idx_parcels_recipient ON parcels(recipient_id);
CREATE INDEX idx_parcels_shipping_type ON parcels(shipping_type);

-- Mise à jour de la fonction create_parcel
CREATE OR REPLACE FUNCTION create_parcel(
    -- Paramètres obligatoires
    p_recipient_name VARCHAR,
    p_recipient_phone VARCHAR,
    p_country VARCHAR,
    p_created_by UUID,
    
    -- Paramètres optionnels
    p_recipient_id UUID DEFAULT NULL,
    p_recipient_email VARCHAR DEFAULT NULL,
    p_recipient_address TEXT DEFAULT NULL,
    p_city VARCHAR DEFAULT NULL,
    p_postal_code VARCHAR DEFAULT NULL,
    p_shipping_type VARCHAR DEFAULT 'Standard',
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
    v_shipping_multiplier DECIMAL;
BEGIN
    -- Générer le numéro de suivi
    v_tracking_number := 'CB-' || 
                        TO_CHAR(CURRENT_DATE, 'YY') || '-' ||
                        LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Définir le multiplicateur selon le type d'expédition
    v_shipping_multiplier := CASE p_shipping_type
        WHEN 'Standard' THEN 1.0
        WHEN 'Express' THEN 1.5
        WHEN 'Maritime' THEN 2.0
        ELSE 1.0
    END;
    
    -- Calculer les coûts
    v_shipping_cost := (CASE p_country
        WHEN 'France' THEN 10
        WHEN 'Belgique' THEN 15
        WHEN 'Suisse' THEN 20
        ELSE 30
    END + COALESCE(p_weight, 0) * 2) * v_shipping_multiplier;
    
    v_total_price := v_shipping_cost;
    
    -- Calculer la date de livraison estimée
    v_estimated_delivery_date := CASE p_shipping_type
        WHEN 'Standard' THEN CASE p_country
            WHEN 'France' THEN CURRENT_TIMESTAMP + interval '3 days'
            WHEN 'Belgique' THEN CURRENT_TIMESTAMP + interval '4 days'
            WHEN 'Suisse' THEN CURRENT_TIMESTAMP + interval '5 days'
            ELSE CURRENT_TIMESTAMP + interval '7 days'
        END
        WHEN 'Express' THEN CASE p_country
            WHEN 'France' THEN CURRENT_TIMESTAMP + interval '2 days'
            WHEN 'Belgique' THEN CURRENT_TIMESTAMP + interval '3 days'
            WHEN 'Suisse' THEN CURRENT_TIMESTAMP + interval '3 days'
            ELSE CURRENT_TIMESTAMP + interval '4 days'
        END
        WHEN 'Maritime' THEN CASE p_country
            WHEN 'France' THEN CURRENT_TIMESTAMP + interval '10 days'
            WHEN 'Belgique' THEN CURRENT_TIMESTAMP + interval '12 days'
            WHEN 'Suisse' THEN CURRENT_TIMESTAMP + interval '14 days'
            ELSE CURRENT_TIMESTAMP + interval '16 days'
        END
        ELSE CURRENT_TIMESTAMP + interval '7 days'
    END;

    -- Insérer le nouveau colis
    INSERT INTO parcels (
        tracking_number,
        status,
        recipient_id,
        recipient_name,
        recipient_phone,
        recipient_email,
        recipient_address,
        country,
        city,
        postal_code,
        shipping_type,
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
        p_recipient_id,
        p_recipient_name,
        p_recipient_phone,
        p_recipient_email,
        p_recipient_address,
        p_country,
        p_city,
        p_postal_code,
        p_shipping_type,
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

-- Activation RLS
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- Recréation des politiques RLS
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

-- Exemple d'utilisation
COMMENT ON FUNCTION create_parcel IS 'Créer un nouveau colis. Exemple d''utilisation:
SELECT * FROM create_parcel(
    ''John Doe'',           -- recipient_name (obligatoire)
    ''+33123456789'',      -- recipient_phone (obligatoire)
    ''France'',            -- country (obligatoire)
    auth.uid(),            -- created_by (obligatoire)
    NULL,                  -- recipient_id (optionnel)
    ''john@example.com'',  -- recipient_email (optionnel)
    ''123 Rue Example'',   -- recipient_address (optionnel)
    ''Paris'',            -- city (optionnel)
    ''75001'',            -- postal_code (optionnel)
    ''Standard'',         -- shipping_type (optionnel: Standard, Express, Maritime)
    2.5,                  -- weight (optionnel)
    ''30x20x15'',         -- dimensions (optionnel)
    ''Fragile'',          -- description (optionnel)
    NULL,                 -- client_id (optionnel)
    ''REF123''            -- client_reference (optionnel)
);';
