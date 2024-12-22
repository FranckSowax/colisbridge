-- Insertion des clients de test
INSERT INTO public.customers (id, created_at, full_name, phone, email, address)
VALUES 
  ('1', NOW(), 'Jean Dupont', '+33612345678', 'jean.dupont@email.com', '123 Rue de Paris, 75001 Paris'),
  ('2', NOW(), 'Marie Martin', '+33623456789', 'marie.martin@email.com', '456 Avenue des Champs-Élysées, 75008 Paris'),
  ('3', NOW(), 'Pierre Durand', '+33634567890', 'pierre.durand@email.com', '789 Boulevard Saint-Germain, 75006 Paris');

-- Insertion des colis de test
INSERT INTO public.parcels (
  id,
  created_at,
  tracking_number,
  status,
  weight,
  destination_country,
  customer_id,
  created_by
)
VALUES
  (
    '1',
    NOW(),
    'CBN2T6UEQRB',
    'recu',
    2.5,
    'FR',
    '1',
    auth.uid()
  ),
  (
    '2',
    NOW(),
    'CBO3R5IVD1X',
    'expedie',
    1.8,
    'BE',
    '2',
    auth.uid()
  ),
  (
    '3',
    NOW(),
    'CBHWF54IECG',
    'receptionne',
    3.2,
    'DE',
    '1',
    auth.uid()
  ),
  (
    '4',
    NOW(),
    'CB4MZJR5Z7O',
    'termine',
    0.9,
    'FR',
    '3',
    auth.uid()
  ),
  (
    '5',
    NOW(),
    'CBQEP3P7V3V',
    'litige',
    4.5,
    'CH',
    '2',
    auth.uid()
  );

-- Mise à jour des séquences
SELECT setval('customers_id_seq', (SELECT MAX(id::integer) FROM customers));
SELECT setval('parcels_id_seq', (SELECT MAX(id::integer) FROM parcels));
