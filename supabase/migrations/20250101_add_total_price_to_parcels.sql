-- Ajout des colonnes nécessaires
alter table public.parcels 
add column if not exists volume_cbm numeric,
add column if not exists weight numeric,
add column if not exists total_price numeric,
add column if not exists currency text;

-- Fonction pour calculer et mettre à jour le prix total
create or replace function update_parcel_total_price()
returns trigger as $$
declare
    price_data jsonb;
begin
    -- Calculer le prix total en fonction du type d'envoi
    if NEW.shipping_type = 'maritime' then
        if NEW.volume_cbm is null or NEW.volume_cbm <= 0 then
            raise exception 'Le volume CBM est requis pour les envois maritimes';
        end if;
    else
        if NEW.weight is null or NEW.weight <= 0 then
            raise exception 'Le poids est requis pour les envois standard et express';
        end if;
    end if;

    price_data := calculate_parcel_price(
        NEW.destination_country,
        NEW.shipping_type,
        NEW.weight,
        NEW.volume_cbm
    );

    if (price_data->>'success')::boolean then
        NEW.total_price := (price_data->>'total_price')::numeric;
        NEW.currency := price_data->>'currency';
    else
        raise exception 'Erreur de calcul du prix: %', price_data->>'error';
    end if;

    return NEW;
end;
$$ language plpgsql;

-- Créer le trigger pour les nouveaux colis
drop trigger if exists calculate_price_before_insert on public.parcels;
create trigger calculate_price_before_insert
    before insert or update of destination_country, shipping_type, weight, volume_cbm
    on public.parcels
    for each row
    execute function update_parcel_total_price();

-- Mettre à jour tous les colis existants avec leur prix total
do $$
declare
    r record;
    price_data jsonb;
begin
    for r in select * from public.parcels loop
        -- Ignorer les colis sans les données nécessaires
        if (r.shipping_type = 'maritime' and (r.volume_cbm is null or r.volume_cbm <= 0)) or
           (r.shipping_type != 'maritime' and (r.weight is null or r.weight <= 0)) then
            raise notice 'Colis % ignoré: données manquantes', r.id;
            continue;
        end if;

        price_data := calculate_parcel_price(
            r.destination_country,
            r.shipping_type,
            r.weight,
            r.volume_cbm
        );

        if (price_data->>'success')::boolean then
            update public.parcels
            set 
                total_price = (price_data->>'total_price')::numeric,
                currency = price_data->>'currency'
            where id = r.id;
        else
            raise notice 'Erreur de calcul du prix pour le colis %: %', r.id, price_data->>'error';
        end if;
    end loop;
end;
$$;
