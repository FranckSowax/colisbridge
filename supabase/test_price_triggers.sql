-- Test 1: Insertion d'un nouveau colis
insert into public.parcels (
    destination_country,
    shipping_type,
    weight,
    volume_cbm
) values 
('france', 'standard', 5.0, null),
('dubai', 'express', 2.5, null),
('gabon', 'maritime', null, 2.0);

-- Vérifier les prix calculés
select 
    id,
    destination_country,
    shipping_type,
    weight,
    volume_cbm,
    total_price,
    currency
from public.parcels
where id in (select id from public.parcels order by created_at desc limit 3);

-- Test 2: Modification d'un colis existant
update public.parcels
set weight = 10.0
where destination_country = 'france'
and shipping_type = 'standard'
and created_at > now() - interval '5 minutes';

-- Vérifier le nouveau prix
select 
    id,
    destination_country,
    shipping_type,
    weight,
    volume_cbm,
    total_price,
    currency
from public.parcels
where destination_country = 'france'
and shipping_type = 'standard'
and created_at > now() - interval '5 minutes';
