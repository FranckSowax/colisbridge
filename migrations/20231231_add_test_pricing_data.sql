-- Ensure the pricing_rules table exists before inserting data
DO $$
BEGIN
    -- Insert test pricing data only if the table is empty
    IF NOT EXISTS (SELECT 1 FROM pricing_rules) THEN
        INSERT INTO pricing_rules (country_code, shipping_type, price_per_kg, price_per_cbm)
        VALUES
            -- France
            ('france', 'standard', 10.00, NULL),
            ('france', 'express', 20.00, NULL),
            ('france', 'maritime', NULL, 100.00),
            
            -- Gabon
            ('gabon', 'standard', 15.00, NULL),
            ('gabon', 'express', 25.00, NULL),
            ('gabon', 'maritime', NULL, 150.00),
            
            -- Togo
            ('togo', 'standard', 15.00, NULL),
            ('togo', 'express', 25.00, NULL),
            ('togo', 'maritime', NULL, 150.00),
            
            -- Côte d'Ivoire
            ('cote_ivoire', 'standard', 15.00, NULL),
            ('cote_ivoire', 'express', 25.00, NULL),
            ('cote_ivoire', 'maritime', NULL, 150.00),
            
            -- Dubai
            ('dubai', 'standard', 20.00, NULL),
            ('dubai', 'express', 30.00, NULL),
            ('dubai', 'maritime', NULL, 200.00);
    END IF;
END
$$;
