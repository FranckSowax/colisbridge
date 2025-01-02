-- Vérifier la structure de la table parcels
\d public.parcels;

-- Vérifier les prix calculés
select 
    tracking_number,
    country,
    shipping_type,
    weight,
    total_price,
    currency
from public.parcels
where total_price is not null
order by created_at desc;
