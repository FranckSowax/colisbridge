-- D'abord, mettre à jour destination_country avec la bonne valeur de destination
update public.parcels
set destination_country = destination
where destination is not null;

-- Mise à jour des prix pour tous les colis existants
do $$
declare
    r record;
    price_data jsonb;
begin
    -- Pour chaque colis existant avec un poids ou volume valide
    for r in select * from public.parcels where weight > 0 or volume_cbm > 0 loop
        -- Calculer le prix selon le type d'envoi et les données existantes
        price_data := calculate_parcel_price(
            lower(r.country), -- Utiliser le pays en minuscules pour correspondre aux règles de tarification
            r.shipping_type,
            r.weight,
            r.volume_cbm
        );

        -- Si le calcul a réussi, mettre à jour le prix
        if (price_data->>'success')::boolean then
            update public.parcels
            set 
                total_price = (price_data->>'total_price')::numeric,
                currency = price_data->>'currency'
            where id = r.id;
            
            raise notice 'Prix mis à jour pour le colis %: % % (destination: %)', 
                r.tracking_number, 
                (price_data->>'total_price')::numeric,
                price_data->>'currency',
                r.country;
        else
            raise notice 'Impossible de calculer le prix pour le colis %: % (destination: %)',
                r.tracking_number,
                price_data->>'error',
                r.country;
        end if;
    end loop;
end;
$$;

-- Vérifier les résultats
select 
    tracking_number,
    country,
    shipping_type,
    weight,
    volume_cbm,
    total_price,
    currency
from public.parcels
order by created_at desc;
