-- Test 1: Envoi Standard vers la France (10€/kg)
select calculate_parcel_price('france', 'standard', 5.0, null);
-- Devrait retourner: 50€ (5kg * 10€)

-- Test 2: Envoi Express vers Dubai (30$/kg)
select calculate_parcel_price('dubai', 'express', 2.5, null);
-- Devrait retourner: 75$ (2.5kg * 30$)

-- Test 3: Envoi Maritime vers le Gabon (240000 XAF/m³)
select calculate_parcel_price('gabon', 'maritime', null, 2.0);
-- Devrait retourner: 480000 XAF (2m³ * 240000 XAF)

-- Test 4: Test d'erreur - Envoi Maritime sans volume
select calculate_parcel_price('france', 'maritime', 10.0, null);
-- Devrait retourner une erreur car le volume est requis

-- Test 5: Test d'erreur - Pays non existant
select calculate_parcel_price('allemagne', 'standard', 1.0, null);
-- Devrait retourner une erreur car le pays n'existe pas

-- Vérification des données dans la table
select * from pricing_rules order by country_code, shipping_type;
