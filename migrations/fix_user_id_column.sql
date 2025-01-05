-- Créer une vue pour les colis avec un alias user_id pour created_by
CREATE OR REPLACE VIEW parcels_view AS
SELECT 
    id,
    tracking_number,
    recipient_id,
    recipient_name,
    destination_country,
    shipping_type,
    weight,
    dimensions,
    status,
    shipping_date,
    photo_urls,
    instructions,
    created_at,
    updated_at,
    created_by AS user_id,
    created_by
FROM parcels;

-- Accorder les permissions nécessaires
GRANT SELECT ON parcels_view TO authenticated;

-- Créer une fonction pour insérer des colis avec user_id
CREATE OR REPLACE FUNCTION insert_parcel_with_user_id(
    p_tracking_number TEXT,
    p_recipient_id UUID,
    p_recipient_name TEXT,
    p_destination_country TEXT,
    p_shipping_type TEXT,
    p_weight DECIMAL,
    p_dimensions TEXT,
    p_status TEXT,
    p_shipping_date TIMESTAMP WITH TIME ZONE,
    p_photo_urls TEXT[],
    p_instructions TEXT,
    p_user_id UUID
) RETURNS UUID AS $$
DECLARE
    v_parcel_id UUID;
BEGIN
    INSERT INTO parcels (
        tracking_number,
        recipient_id,
        recipient_name,
        destination_country,
        shipping_type,
        weight,
        dimensions,
        status,
        shipping_date,
        photo_urls,
        instructions,
        created_by
    ) VALUES (
        p_tracking_number,
        p_recipient_id,
        p_recipient_name,
        p_destination_country,
        p_shipping_type,
        p_weight,
        p_dimensions,
        p_status,
        p_shipping_date,
        p_photo_urls,
        p_instructions,
        p_user_id
    ) RETURNING id INTO v_parcel_id;

    RETURN v_parcel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
