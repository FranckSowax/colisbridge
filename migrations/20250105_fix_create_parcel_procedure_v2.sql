-- Drop the existing function
DROP FUNCTION IF EXISTS create_new_parcel;

-- Recreate the function with correct return values
CREATE OR REPLACE FUNCTION create_new_parcel(
    p_recipient_name TEXT,
    p_recipient_phone TEXT,
    p_country TEXT,
    p_created_by UUID,
    p_recipient_id UUID DEFAULT NULL,
    p_recipient_email TEXT DEFAULT NULL,
    p_recipient_address TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_postal_code TEXT DEFAULT NULL,
    p_shipping_type TEXT DEFAULT 'Standard',
    p_weight NUMERIC DEFAULT 0,
    p_dimensions TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_client_id UUID DEFAULT NULL,
    p_client_reference TEXT DEFAULT NULL
) RETURNS TABLE (
    parcel_id UUID,
    tracking_number TEXT
) LANGUAGE plpgsql AS $$
DECLARE
    v_tracking_number TEXT;
    v_parcel_id UUID;
BEGIN
    -- Generate a unique tracking number
    v_tracking_number := 'CB-' || to_char(NOW(), 'YY') || '-' || floor(random() * 1000000)::TEXT;
    
    -- Insert the new parcel
    INSERT INTO parcels (
        tracking_number,
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
        instructions,
        created_by,
        recipient_id,
        client_id,
        client_reference,
        status
    ) VALUES (
        v_tracking_number,
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
        p_created_by,
        p_recipient_id,
        p_client_id,
        p_client_reference,
        'recu'
    )
    RETURNING id INTO v_parcel_id;

    -- Return both the parcel ID and tracking number
    RETURN QUERY 
    SELECT 
        v_parcel_id AS parcel_id,
        v_tracking_number AS tracking_number;
END;
$$;
