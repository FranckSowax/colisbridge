-- Insertion de données de test dans la table parcels

-- 1. Insertion des destinataires de test
INSERT INTO recipients (id, name, phone, email, created_by)
VALUES 
    ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'Jean Dupont', '+33612345678', 'jean.dupont@example.com', 'e9a1d5c9-7d01-4567-89ab-cdef01234567'),
    ('d290f1ee-6c54-4b01-90e6-d701748f0852', 'Marie Martin', '+33623456789', 'marie.martin@example.com', 'e9a1d5c9-7d01-4567-89ab-cdef01234567'),
    ('d290f1ee-6c54-4b01-90e6-d701748f0853', 'Pierre Durand', '+33634567890', 'pierre.durand@example.com', 'e9a1d5c9-7d01-4567-89ab-cdef01234567'),
    ('d290f1ee-6c54-4b01-90e6-d701748f0854', 'Sophie Bernard', '+33645678901', 'sophie.bernard@example.com', 'e9a1d5c9-7d01-4567-89ab-cdef01234567')
ON CONFLICT (id) DO NOTHING;

-- 2. Insertion des colis de test
INSERT INTO parcels (
    id,
    tracking_number,
    recipient_id,
    recipient_name,
    destination_country,
    shipping_type,
    weight,
    status,
    created_by,
    created_at,
    updated_at
)
VALUES 
    (
        'a1b2c3d4-e5f6-4a5b-8c7d-1234567890ab',
        'CB202501050001',
        'd290f1ee-6c54-4b01-90e6-d701748f0851',
        'Jean Dupont',
        'France',
        'standard',
        2.5,
        'recu',
        'e9a1d5c9-7d01-4567-89ab-cdef01234567',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'b2c3d4e5-f6a7-5b6c-9d8e-234567890abc',
        'CB202501050002',
        'd290f1ee-6c54-4b01-90e6-d701748f0852',
        'Marie Martin',
        'Gabon',
        'express',
        1.8,
        'expedie',
        'e9a1d5c9-7d01-4567-89ab-cdef01234567',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'c3d4e5f6-a7b8-6c7d-0e9f-34567890abcd',
        'CB202501050003',
        'd290f1ee-6c54-4b01-90e6-d701748f0853',
        'Pierre Durand',
        'Togo',
        'maritime',
        5.0,
        'receptionne',
        'e9a1d5c9-7d01-4567-89ab-cdef01234567',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'd4e5f6a7-b8c9-7d8e-1f0a-4567890abcde',
        'CB202501050004',
        'd290f1ee-6c54-4b01-90e6-d701748f0854',
        'Sophie Bernard',
        'Côte d''Ivoire',
        'express',
        3.2,
        'termine',
        'e9a1d5c9-7d01-4567-89ab-cdef01234567',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (id) DO UPDATE 
SET 
    tracking_number = EXCLUDED.tracking_number,
    recipient_id = EXCLUDED.recipient_id,
    recipient_name = EXCLUDED.recipient_name,
    destination_country = EXCLUDED.destination_country,
    shipping_type = EXCLUDED.shipping_type,
    weight = EXCLUDED.weight,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

-- 3. Vérification des données insérées
SELECT 
    p.tracking_number,
    p.recipient_name,
    p.destination_country,
    p.shipping_type,
    p.weight,
    p.status,
    r.phone,
    r.email
FROM parcels p
JOIN recipients r ON p.recipient_id = r.id
WHERE p.created_by = 'e9a1d5c9-7d01-4567-89ab-cdef01234567'
ORDER BY p.created_at DESC;
