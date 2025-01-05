-- Fonction pour générer un numéro de suivi unique
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS VARCHAR AS $$
DECLARE
    tracking VARCHAR;
    exists_count INTEGER;
BEGIN
    LOOP
        -- Format: CB-YEAR-RANDOM
        tracking := 'CB-' || 
                   TO_CHAR(CURRENT_DATE, 'YY') || '-' ||
                   LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
                   
        -- Vérifier si le numéro existe déjà
        SELECT COUNT(*) INTO exists_count
        FROM parcels
        WHERE tracking_number = tracking;
        
        EXIT WHEN exists_count = 0;
    END LOOP;
    
    RETURN tracking;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le prix d'expédition
CREATE OR REPLACE FUNCTION calculate_shipping_cost(
    p_weight DECIMAL,
    p_destination_country VARCHAR,
    p_dimensions VARCHAR
)
RETURNS DECIMAL AS $$
DECLARE
    base_cost DECIMAL := 10.00;  -- Coût de base
    weight_cost DECIMAL := 0;    -- Coût basé sur le poids
    country_multiplier DECIMAL := 1;  -- Multiplicateur selon le pays
BEGIN
    -- Calcul basé sur le poids
    weight_cost := COALESCE(p_weight, 1) * 2;
    
    -- Ajustement selon le pays
    CASE p_destination_country
        WHEN 'France' THEN country_multiplier := 1;
        WHEN 'Belgique' THEN country_multiplier := 1.2;
        WHEN 'Suisse' THEN country_multiplier := 1.5;
        ELSE country_multiplier := 2;
    END CASE;
    
    RETURN ROUND((base_cost + weight_cost) * country_multiplier, 2);
END;
$$ LANGUAGE plpgsql;

-- Fonction principale pour créer un nouveau colis
CREATE OR REPLACE FUNCTION create_parcel(
    -- Informations du destinataire
    p_recipient_name VARCHAR,
    p_recipient_phone VARCHAR,
    p_recipient_email VARCHAR,
    
    -- Informations de livraison
    p_destination_country VARCHAR,
    p_destination_city VARCHAR,
    p_destination_address TEXT,
    p_destination_postal_code VARCHAR,
    
    -- Informations du colis
    p_weight DECIMAL,
    p_dimensions VARCHAR,
    p_description TEXT,
    
    -- Informations client
    p_client_id UUID,
    p_client_reference VARCHAR,
    
    -- Informations créateur
    p_created_by UUID
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
    v_tracking_number := generate_tracking_number();
    
    -- Calculer les coûts
    v_shipping_cost := calculate_shipping_cost(p_weight, p_destination_country, p_dimensions);
    v_total_price := v_shipping_cost;  -- Peut être modifié selon d'autres facteurs
    
    -- Calculer la date de livraison estimée
    v_estimated_delivery_date := CASE p_destination_country
        WHEN 'France' THEN CURRENT_TIMESTAMP + interval '3 days'
        WHEN 'Belgique' THEN CURRENT_TIMESTAMP + interval '4 days'
        WHEN 'Suisse' THEN CURRENT_TIMESTAMP + interval '5 days'
        ELSE CURRENT_TIMESTAMP + interval '7 days'
    END;

    -- Insérer le nouveau colis
    INSERT INTO parcels (
        tracking_number,
        status,
        recipient_name,
        recipient_phone,
        recipient_email,
        destination_country,
        destination_city,
        destination_address,
        destination_postal_code,
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
        p_recipient_name,
        p_recipient_phone,
        p_recipient_email,
        p_destination_country,
        p_destination_city,
        p_destination_address,
        p_destination_postal_code,
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

-- Fonction pour mettre à jour le statut d'un colis
CREATE OR REPLACE FUNCTION update_parcel_status(
    p_parcel_id UUID,
    p_new_status VARCHAR,
    p_updated_by UUID
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_current_status VARCHAR;
    v_created_by UUID;
BEGIN
    -- Vérifier si le colis existe et récupérer son statut actuel
    SELECT status, created_by
    INTO v_current_status, v_created_by
    FROM parcels
    WHERE id = p_parcel_id;
    
    -- Vérifier les permissions
    IF NOT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = p_updated_by
        AND (
            id = v_created_by
            OR raw_user_meta_data->>'role' = 'admin'
        )
    ) THEN
        RETURN QUERY SELECT false, 'Permissions insuffisantes pour mettre à jour le statut';
        RETURN;
    END IF;

    -- Vérifier la validité du nouveau statut
    IF p_new_status NOT IN ('Reçu', 'En cours', 'Expédié', 'Litige', 'Terminé') THEN
        RETURN QUERY SELECT false, 'Statut invalide';
        RETURN;
    END IF;

    -- Mettre à jour le statut
    UPDATE parcels
    SET 
        status = p_new_status,
        sent_date = CASE 
            WHEN p_new_status = 'Expédié' AND sent_date IS NULL 
            THEN CURRENT_TIMESTAMP 
            ELSE sent_date 
        END,
        delivered_date = CASE 
            WHEN p_new_status = 'Terminé' 
            THEN CURRENT_TIMESTAMP 
            ELSE delivered_date 
        END
    WHERE id = p_parcel_id;

    -- Créer une notification de changement de statut
    INSERT INTO notifications (
        type,
        title,
        message,
        reference_type,
        reference_id,
        created_for,
        metadata
    )
    SELECT
        'status_update',
        'Statut du colis mis à jour',
        'Le colis ' || tracking_number || ' est maintenant ' || p_new_status,
        'parcel',
        id,
        created_by,
        jsonb_build_object(
            'old_status', v_current_status,
            'new_status', p_new_status,
            'tracking_number', tracking_number
        )
    FROM parcels
    WHERE id = p_parcel_id;

    RETURN QUERY SELECT true, 'Statut mis à jour avec succès';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exemple d'utilisation:
COMMENT ON FUNCTION create_parcel IS 'Pour créer un nouveau colis:
SELECT * FROM create_parcel(
    ''John Doe'',                -- recipient_name
    ''+33123456789'',           -- recipient_phone
    ''john@example.com'',       -- recipient_email
    ''France'',                 -- destination_country
    ''Paris'',                  -- destination_city
    ''123 Rue Example'',        -- destination_address
    ''75001'',                  -- destination_postal_code
    2.5,                       -- weight
    ''30x20x15'',              -- dimensions
    ''Fragile'',               -- description
    NULL,                      -- client_id (optionnel)
    ''REF123'',                -- client_reference (optionnel)
    auth.uid()                 -- created_by
);';
