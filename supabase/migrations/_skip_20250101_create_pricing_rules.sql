-- Suppression de la table si elle existe déjà (pour éviter les conflits)
drop table if exists public.pricing_rules;

-- Création de la table pricing_rules
create table public.pricing_rules (
    id uuid default gen_random_uuid() primary key,
    country_code text not null,
    currency text not null,
    shipping_type text not null,
    price_per_unit numeric not null,
    unit_type text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint shipping_type_check check (shipping_type in ('standard', 'express', 'maritime')),
    constraint unit_type_check check (unit_type in ('kg', 'cbm'))
);

-- Ajout des règles de tarification initiales
insert into public.pricing_rules (country_code, currency, shipping_type, price_per_unit, unit_type) values
-- France
('france', 'EUR', 'standard', 10.00, 'kg'),
('france', 'EUR', 'express', 20.00, 'kg'),
('france', 'EUR', 'maritime', 100.00, 'cbm'),
-- Dubai
('dubai', 'USD', 'standard', 20.00, 'kg'),
('dubai', 'USD', 'express', 30.00, 'kg'),
('dubai', 'USD', 'maritime', 200.00, 'cbm'),
-- Gabon
('gabon', 'XAF', 'standard', 13000, 'kg'),
('gabon', 'XAF', 'express', 20000, 'kg'),
('gabon', 'XAF', 'maritime', 240000, 'cbm'),
-- Togo
('togo', 'XAF', 'standard', 15, 'kg'),
('togo', 'XAF', 'express', 25, 'kg'),
('togo', 'XAF', 'maritime', 150, 'cbm'),
-- Côte d'Ivoire
('cote_ivoire', 'XAF', 'standard', 15, 'kg'),
('cote_ivoire', 'XAF', 'express', 25, 'kg'),
('cote_ivoire', 'XAF', 'maritime', 150, 'cbm');

-- Création de la fonction de calcul du prix
create or replace function calculate_parcel_price(
    p_country text,
    p_shipping_type text,
    p_weight numeric,
    p_cbm numeric
) returns jsonb as $$
declare
    v_price_rule record;
    v_total_price numeric;
    v_currency text;
begin
    -- Récupérer la règle de tarification appropriée
    select * into v_price_rule
    from pricing_rules
    where country_code = lower(p_country)
    and shipping_type = lower(p_shipping_type)
    limit 1;

    if not found then
        return jsonb_build_object(
            'error', 'Tarification non trouvée pour ces critères',
            'success', false
        );
    end if;

    -- Calculer le prix total selon le type d'envoi
    if v_price_rule.unit_type = 'kg' then
        if p_weight is null or p_weight <= 0 then
            return jsonb_build_object(
                'error', 'Poids requis pour ce type d''envoi',
                'success', false
            );
        end if;
        v_total_price := p_weight * v_price_rule.price_per_unit;
    else -- cbm
        if p_cbm is null or p_cbm <= 0 then
            return jsonb_build_object(
                'error', 'Volume CBM requis pour ce type d''envoi',
                'success', false
            );
        end if;
        v_total_price := p_cbm * v_price_rule.price_per_unit;
    end if;

    return jsonb_build_object(
        'total_price', v_total_price,
        'currency', v_price_rule.currency,
        'success', true
    );
end;
$$ language plpgsql;
