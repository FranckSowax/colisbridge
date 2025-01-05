-- Mise à jour des triggers et fonctions pour utiliser price_per_unit
CREATE OR REPLACE FUNCTION calculate_parcel_price(
    p_country text,
    p_shipping_type text,
    p_weight numeric,
    p_cbm numeric
) RETURNS jsonb AS $$
DECLARE
    v_price_rule record;
    v_total_price numeric;
    v_currency text;
BEGIN
    -- Récupération de la règle de prix appropriée
    SELECT *
    INTO v_price_rule
    FROM pricing_rules
    WHERE country_code = lower(p_country)
    AND shipping_type = lower(p_shipping_type)
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Aucune règle de prix trouvée pour ce pays et ce type d''envoi'
        );
    END IF;

    -- Calcul du prix en fonction du type d'unité
    IF v_price_rule.unit_type = 'kg' AND p_weight IS NOT NULL THEN
        v_total_price := v_price_rule.price_per_unit * p_weight;
    ELSIF v_price_rule.unit_type = 'cbm' AND p_cbm IS NOT NULL THEN
        v_total_price := v_price_rule.price_per_unit * p_cbm;
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Données de mesure invalides pour le type d''unité'
        );
    END IF;

    -- Retourne le résultat
    RETURN jsonb_build_object(
        'success', true,
        'total_price', v_total_price,
        'currency', v_price_rule.currency,
        'unit_price', v_price_rule.price_per_unit,
        'unit_type', v_price_rule.unit_type
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le prix total des colis
CREATE OR REPLACE FUNCTION update_parcel_total_price()
RETURNS TRIGGER AS $$
DECLARE
    price_calc jsonb;
BEGIN
    -- Calcul du prix en fonction du type d'envoi
    price_calc := calculate_parcel_price(
        NEW.destination_country,
        NEW.shipping_type,
        NEW.weight,
        NEW.cbm
    );

    IF (price_calc->>'success')::boolean THEN
        NEW.total_price := (price_calc->>'total_price')::numeric;
        NEW.currency := price_calc->>'currency';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger si nécessaire
DROP TRIGGER IF EXISTS update_parcel_price ON parcels;
CREATE TRIGGER update_parcel_price
    BEFORE INSERT OR UPDATE ON parcels
    FOR EACH ROW
    EXECUTE FUNCTION update_parcel_total_price();

-- Mettre à jour les prix existants
UPDATE parcels
SET updated_at = NOW()
WHERE total_price IS NULL OR total_price = 0;
