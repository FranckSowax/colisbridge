-- Create function to get parcels with recipient information
CREATE OR REPLACE FUNCTION get_parcels_with_recipient(user_id UUID)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    tracking_number TEXT,
    destination_country TEXT,
    shipping_type TEXT,
    weight DECIMAL,
    volume_cbm DECIMAL,
    shipping_date TIMESTAMPTZ,
    statut TEXT,
    status TEXT,
    recipient_id UUID,
    recipient_name TEXT,
    recipient_phone TEXT,
    recipient_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.created_at,
        p.tracking_number,
        p.destination_country,
        p.shipping_type,
        p.weight,
        COALESCE(p.volume_cbm, p.cbm, 0) as volume_cbm,
        p.shipping_date,
        p.statut,
        p.status,
        r.id as recipient_id,
        r.name as recipient_name,
        r.phone as recipient_phone,
        r.email as recipient_email
    FROM parcels p
    LEFT JOIN recipients r ON p.recipient_id = r.id
    WHERE p.created_by = user_id
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
