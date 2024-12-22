-- Insérer des destinataires de démonstration
DO $$
DECLARE
    user_id uuid;
    current_date text;
BEGIN
    -- Récupérer le premier ID utilisateur disponible
    SELECT id INTO user_id FROM auth.users LIMIT 1;
    
    -- Obtenir la date actuelle au format YYYYMMDD
    current_date := TO_CHAR(NOW(), 'YYYYMMDD');

    -- Insérer les destinataires
    INSERT INTO recipients (id, name, phone, email, created_by)
    VALUES
        ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Jean Dupont', '+33612345678', 'jean.dupont@email.com', user_id),
        ('550e8400-e29b-41d4-a716-446655440000', 'Marie Martin', '+33623456789', 'marie.martin@email.com', user_id),
        ('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Kofi Mensah', '+233501234567', 'kofi.mensah@email.com', user_id),
        ('6ba7b811-9dad-11d1-80b4-00c04fd430c8', 'Aminata Diallo', '+221770123456', 'aminata.diallo@email.com', user_id),
        ('6ba7b812-9dad-11d1-80b4-00c04fd430c8', 'Olivier Koffi', '+22507123456', 'olivier.koffi@email.com', user_id);

    -- Insérer les colis avec des numéros de suivi uniques
    INSERT INTO parcels (id, recipient_id, tracking_number, destination_country, shipping_type, weight, status, created_by)
    VALUES
        ('7ba7b810-9dad-11d1-80b4-00c04fd430c8', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 
         CONCAT('CB', current_date, '901'), 'France', 'standard', 2.5, 'recu', user_id),
        ('7ba7b811-9dad-11d1-80b4-00c04fd430c8', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 
         CONCAT('CB', current_date, '902'), 'France', 'express', 1.8, 'en_preparation', user_id),
        ('7ba7b812-9dad-11d1-80b4-00c04fd430c8', '550e8400-e29b-41d4-a716-446655440000', 
         CONCAT('CB', current_date, '903'), 'Gabon', 'maritime', 3.2, 'en_transit', user_id),
        ('7ba7b813-9dad-11d1-80b4-00c04fd430c8', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', 
         CONCAT('CB', current_date, '904'), 'Togo', 'standard', 5.0, 'en_transit', user_id),
        ('7ba7b814-9dad-11d1-80b4-00c04fd430c8', '6ba7b811-9dad-11d1-80b4-00c04fd430c8', 
         CONCAT('CB', current_date, '905'), 'Côte d''Ivoire', 'express', 1.2, 'recu', user_id),
        ('7ba7b815-9dad-11d1-80b4-00c04fd430c8', '6ba7b812-9dad-11d1-80b4-00c04fd430c8', 
         CONCAT('CB', current_date, '906'), 'Dubaï', 'maritime', 4.7, 'en_preparation', user_id);
END $$;
