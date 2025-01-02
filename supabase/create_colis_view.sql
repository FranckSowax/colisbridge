-- Créer une vue pour l'affichage des colis
create or replace view public.colis_view as
select
    tracking_number as "Numéro de suivi",
    recipient_name as "Destinataire",
    country as "Pays",
    weight || ' kg' as "Poids",
    case 
        when total_price is not null then 
            total_price || ' ' || currency
        else '-'
    end as "Prix Total",
    status as "Statut",
    created_at as "Date"
from public.parcels
order by created_at desc;

-- Test de la vue
select * from public.colis_view;
