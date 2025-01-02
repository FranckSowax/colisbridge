-- Fonction pour générer un numéro de suivi unique
create or replace function generate_tracking_number()
returns text as $$
declare
    tracking text;
    exists_already boolean;
begin
    loop
        -- Générer un numéro de suivi au format CB-YYYYMMDD-XXXXX
        tracking := 'CB-' || to_char(current_date, 'YYYYMMDD') || '-' || 
                   lpad(floor(random() * 100000)::text, 5, '0');
                   
        -- Vérifier si le numéro existe déjà
        select exists(
            select 1 from parcels where tracking_number = tracking
        ) into exists_already;
        
        -- Sortir de la boucle si le numéro est unique
        exit when not exists_already;
    end loop;
    
    return tracking;
end;
$$ language plpgsql;

-- Créer un utilisateur de test si nécessaire
do $$
declare
    test_user_id uuid;
begin
    -- Vérifier si l'utilisateur de test existe déjà
    select id into test_user_id from auth.users where email = 'test@example.com' limit 1;
    
    -- Si l'utilisateur n'existe pas, le créer
    if test_user_id is null then
        insert into auth.users (email, encrypted_password, email_confirmed_at)
        values ('test@example.com', 'test_password', now())
        returning id into test_user_id;
    end if;
end;
$$;

-- Fonction pour valider et insérer un colis
create or replace function insert_parcel(
    p_destination_country text,
    p_shipping_type text,
    p_weight numeric,
    p_volume_cbm numeric
) returns uuid as $$
declare
    v_parcel_id uuid;
    v_created_by uuid;
begin
    -- Récupérer l'ID de l'utilisateur de test
    select id into v_created_by from auth.users where email = 'test@example.com' limit 1;
    
    -- Valider les données selon le type d'envoi
    if p_shipping_type = 'maritime' then
        if p_volume_cbm is null or p_volume_cbm <= 0 then
            raise exception 'Le volume CBM est requis pour les envois maritimes';
        end if;
    else
        if p_weight is null or p_weight <= 0 then
            raise exception 'Le poids est requis pour les envois standard et express';
        end if;
    end if;

    -- Insérer le colis
    insert into public.parcels (
        destination_country,
        shipping_type,
        weight,
        volume_cbm,
        tracking_number,
        status,
        created_by,
        origin_country
    ) values (
        p_destination_country,
        p_shipping_type,
        p_weight,
        p_volume_cbm,
        generate_tracking_number(),
        'pending',
        v_created_by,
        'france'
    )
    returning id into v_parcel_id;

    return v_parcel_id;
end;
$$ language plpgsql;

-- Test des insertions avec validation
do $$
begin
    -- Test 1: Colis standard avec poids
    perform insert_parcel('france', 'standard', 5.0, null);
    
    -- Test 2: Colis maritime avec volume
    perform insert_parcel('gabon', 'maritime', null, 2.0);
    
    -- Test 3: Colis standard sans poids (devrait échouer)
    begin
        perform insert_parcel('france', 'standard', null, null);
    exception when others then
        raise notice 'Test 3 échoué comme prévu: %', sqlerrm;
    end;
    
    -- Test 4: Colis maritime sans volume (devrait échouer)
    begin
        perform insert_parcel('gabon', 'maritime', 5.0, null);
    exception when others then
        raise notice 'Test 4 échoué comme prévu: %', sqlerrm;
    end;
end;
$$;

-- Vérifier les résultats
select 
    tracking_number,
    destination_country,
    shipping_type,
    weight,
    volume_cbm,
    total_price,
    currency,
    status,
    created_by,
    created_at
from public.parcels
where created_at > now() - interval '5 minutes'
order by created_at desc;
