-- Synchroniser les prix de la table parcels vers la table colis
update public.colis c
set "Prix Total" = cast(p.total_price as text)
from public.parcels p
where c."Numéro de suivi" = p.tracking_number
and p.total_price is not null;

-- Vérifier les résultats
select 
    c."Numéro de suivi",
    c."Prix Total" as prix_colis,
    p.total_price as prix_parcels,
    p.currency
from public.colis c
join public.parcels p on c."Numéro de suivi" = p.tracking_number
order by c."Numéro de suivi" desc;
